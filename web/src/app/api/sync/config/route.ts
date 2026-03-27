import { NextRequest, NextResponse } from "next/server";
import { getSession, isSpotifyConnected, isYouTubeConnected } from "@/lib/session";
import { refreshSpotifyToken, findOrCreateSpotifyPlaylist } from "@/lib/spotify";
import { refreshYouTubeToken, findOrCreatePlaylist } from "@/lib/youtube";
import { saveSyncConfig, getSyncConfig } from "@/lib/kv";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";
import type { SyncConfig, SyncDirection } from "@/types";

// ---------------------------------------------------------------------------
// GET /api/sync/config
// Returns the current sync configuration for the authenticated user.
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await getSession();

    if (!isSpotifyConnected(session) || !isYouTubeConnected(session)) {
      return NextResponse.json(
        { error: "Both Spotify and YouTube must be connected before configuring sync." },
        { status: 401 }
      );
    }

    // Prefer KV config over session config (KV is the source of truth)
    let config: SyncConfig | null = null;

    if (session.spotifyUserId) {
      try {
        config = await getSyncConfig(session.spotifyUserId);
      } catch {
        // KV not available — fall back to session
      }
    }

    if (!config && session.syncConfig) {
      config = session.syncConfig;
    }

    if (!config) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[sync/config GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sync configuration." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/sync/config
// Saves (or updates) the sync configuration.
//
// Expected body:
// {
//   spotifyPlaylist: string,      // "Liked Songs" or a playlist name
//   youtubePlaylist: string,      // YouTube playlist name
//   intervalSeconds?: number,     // default 300
//   direction?: SyncDirection,    // default "spotify_to_youtube"
// }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!isSpotifyConnected(session)) {
      return NextResponse.json(
        { error: "Spotify is not connected. Please connect Spotify first." },
        { status: 401 }
      );
    }

    if (!isYouTubeConnected(session)) {
      return NextResponse.json(
        { error: "YouTube is not connected. Please connect YouTube first." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: {
      spotifyPlaylist?: string;
      youtubePlaylist?: string;
      intervalSeconds?: number;
      direction?: SyncDirection;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const {
      spotifyPlaylist,
      youtubePlaylist,
      intervalSeconds = 300,
      direction = "spotify_to_youtube",
    } = body;

    if (!spotifyPlaylist || spotifyPlaylist.trim() === "") {
      return NextResponse.json(
        { error: "spotifyPlaylist is required." },
        { status: 400 }
      );
    }

    if (!youtubePlaylist || youtubePlaylist.trim() === "") {
      return NextResponse.json(
        { error: "youtubePlaylist is required." },
        { status: 400 }
      );
    }

    if (
      typeof intervalSeconds !== "number" ||
      intervalSeconds < 60 ||
      intervalSeconds > 86400
    ) {
      return NextResponse.json(
        { error: "intervalSeconds must be a number between 60 and 86400." },
        { status: 400 }
      );
    }

    // Resolve OAuth app credentials
    const appCreds = await getResolvedCredentials();
    if (!appCreds) {
      return NextResponse.json(
        { error: "OAuth app credentials are not configured. Please complete setup." },
        { status: 500 }
      );
    }

    // Ensure YouTube access token is still valid; refresh if needed
    let youtubeAccessToken = session.youtubeAccessToken!;

    const testResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
      { headers: { Authorization: `Bearer ${youtubeAccessToken}` } }
    );

    if (testResponse.status === 401) {
      const refreshed = await refreshYouTubeToken(session.youtubeRefreshToken!, {
        clientId: appCreds.googleClientId,
        clientSecret: appCreds.googleClientSecret,
      });
      if (!refreshed?.access_token) {
        return NextResponse.json(
          { error: "YouTube session expired. Please reconnect YouTube." },
          { status: 401 }
        );
      }
      session.youtubeAccessToken = refreshed.access_token;
      youtubeAccessToken = refreshed.access_token;
    }

    // Ensure Spotify token is fresh too
    let spotifyAccessToken = session.spotifyAccessToken!;

    const spotifyTestResponse = await fetch(
      "https://api.spotify.com/v1/me",
      { headers: { Authorization: `Bearer ${spotifyAccessToken}` } }
    );

    if (spotifyTestResponse.status === 401) {
      const refreshed = await refreshSpotifyToken(session.spotifyRefreshToken!, {
        clientId: appCreds.spotifyClientId,
        clientSecret: appCreds.spotifyClientSecret,
      });
      if (!refreshed?.access_token) {
        return NextResponse.json(
          { error: "Spotify session expired. Please reconnect Spotify." },
          { status: 401 }
        );
      }
      session.spotifyAccessToken = refreshed.access_token;
      spotifyAccessToken = refreshed.access_token;
    }

    // isLikedSongs only applies when Spotify is the source
    const isLikedSongs =
      direction === "spotify_to_youtube" &&
      spotifyPlaylist.trim().toLowerCase() === "liked songs";

    let youtubePlaylistId: string | undefined;
    let spotifyPlaylistId: string | undefined;
    let playlistCreated = false;
    let message: string;

    if (direction === "spotify_to_youtube") {
      // Resolve (or create) the YouTube destination playlist
      const ytResult = await findOrCreatePlaylist(youtubeAccessToken, youtubePlaylist.trim());

      if (!ytResult) {
        return NextResponse.json(
          {
            error: `Failed to find or create YouTube playlist "${youtubePlaylist}". Check your YouTube permissions.`,
          },
          { status: 500 }
        );
      }

      youtubePlaylistId = ytResult.id;
      playlistCreated = ytResult.created;
      message = playlistCreated
        ? `YouTube playlist "${youtubePlaylist}" was created successfully.`
        : `Using existing YouTube playlist "${youtubePlaylist}".`;
    } else {
      // youtube_to_spotify: resolve (or create) the Spotify destination playlist
      const userId = session.spotifyUserId;
      if (!userId) {
        return NextResponse.json(
          { error: "Spotify user ID is missing. Please reconnect Spotify." },
          { status: 401 }
        );
      }

      const spResult = await findOrCreateSpotifyPlaylist(
        spotifyAccessToken,
        userId,
        spotifyPlaylist.trim()
      );

      if (!spResult) {
        return NextResponse.json(
          {
            error: `Failed to find or create Spotify playlist "${spotifyPlaylist}". Check your Spotify permissions. You may need to reconnect Spotify to grant write access.`,
          },
          { status: 500 }
        );
      }

      spotifyPlaylistId = spResult.id;
      playlistCreated = spResult.created;
      message = playlistCreated
        ? `Spotify playlist "${spotifyPlaylist}" was created successfully.`
        : `Using existing Spotify playlist "${spotifyPlaylist}".`;
    }

    // Build and persist the config
    const config: SyncConfig = {
      direction,
      spotifyPlaylist: spotifyPlaylist.trim(),
      spotifyPlaylistId,
      isLikedSongs,
      youtubePlaylist: youtubePlaylist.trim(),
      youtubePlaylistId,
      intervalSeconds,
    };

    // Save to KV (primary) and session (fallback)
    if (session.spotifyUserId) {
      try {
        await saveSyncConfig(session.spotifyUserId, config);
      } catch (err) {
        console.warn("[sync/config POST] KV save failed, using session only:", err);
      }
    }

    session.syncConfig = config;
    await session.save();

    return NextResponse.json({
      success: true,
      config,
      playlistCreated,
      message,
    });
  } catch (error) {
    console.error("[sync/config POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to save sync configuration." },
      { status: 500 }
    );
  }
}
