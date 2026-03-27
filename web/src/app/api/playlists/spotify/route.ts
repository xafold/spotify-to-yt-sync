import { NextResponse } from "next/server";
import { getSession, isSpotifyConnected } from "@/lib/session";
import { getUserPlaylists, refreshSpotifyToken } from "@/lib/spotify";
import { getResolvedCredentials } from "@/lib/credentials";
import type { SpotifyPlaylist } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!isSpotifyConnected(session)) {
      return NextResponse.json(
        { error: "Spotify not connected" },
        { status: 401 }
      );
    }

    let accessToken = session.spotifyAccessToken!;

    // Try fetching playlists; if we get a 401, refresh the token and retry
    let playlists = await getUserPlaylists(accessToken);

    if (!playlists) {
      // Attempt token refresh
      const appCreds = await getResolvedCredentials();
      if (!appCreds) {
        return NextResponse.json({ error: "OAuth credentials not configured." }, { status: 500 });
      }
      const refreshed = await refreshSpotifyToken(session.spotifyRefreshToken!, {
        clientId: appCreds.spotifyClientId,
        clientSecret: appCreds.spotifyClientSecret,
      });
      if (!refreshed?.access_token) {
        return NextResponse.json(
          { error: "Spotify session expired. Please reconnect." },
          { status: 401 }
        );
      }

      // Persist refreshed token
      session.spotifyAccessToken = refreshed.access_token;
      await session.save();
      accessToken = refreshed.access_token;

      playlists = await getUserPlaylists(accessToken);
    }

    // Shape the response
    const result: SpotifyPlaylist[] = [
      // Always include "Liked Songs" as the first option
      {
        id: "__liked_songs__",
        name: "Liked Songs",
        trackCount: 0,
        imageUrl: undefined,
        isPublic: false,
      },
      // Then the user's actual playlists
      ...(playlists ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        trackCount: p.tracks?.total ?? 0,
        imageUrl: p.images?.[0]?.url,
        isPublic: p.public ?? false,
      })),
    ];

    return NextResponse.json({ playlists: result });
  } catch (error) {
    console.error("[playlists/spotify] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify playlists" },
      { status: 500 }
    );
  }
}
