import { NextRequest, NextResponse } from "next/server";
import { getSession, isSpotifyConnected, isYouTubeConnected } from "@/lib/session";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";
import {
  refreshSpotifyToken,
  getLikedSongs,
  getPlaylistTracks,
  findPlaylistByName,
  searchSpotifyTrack,
  addTracksToSpotifyPlaylist,
  findOrCreateSpotifyPlaylist,
  cleanYouTubeTitle,
} from "@/lib/spotify";
import {
  refreshYouTubeToken,
  searchVideo,
  addVideoToPlaylist,
  findOrCreatePlaylist,
  getPlaylistItems,
} from "@/lib/youtube";
import { getSyncedIds, addSyncedIds, updateSyncStats, appendSyncHistory } from "@/lib/kv";
import type { SyncChunkResult, SyncHistoryEntry, SpotifyTrack, YouTubeTrack } from "@/types";

// ---------------------------------------------------------------------------
// How many tracks to process per API call.
// Keep this low enough to stay within Vercel's 60-second function limit.
// ---------------------------------------------------------------------------
const DEFAULT_CHUNK_SIZE = 15;

// Delay between search API calls (ms) to avoid burning through daily quotas.
const SEARCH_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// POST /api/sync
//
// Runs one "chunk" of the sync process. The client calls this endpoint
// repeatedly until `done: true` is returned.
//
// Request body (all fields optional):
// {
//   offset?: number,        // index of first unprocessed track (default 0)
//   chunkSize?: number,     // tracks per call (default 15)
//   force?: boolean,        // re-sync tracks that were already synced before
// }
//
// Response: SyncChunkResult
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ─────────────────────────────────────────────────────
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

    const syncConfig = session.syncConfig;
    if (!syncConfig) {
      return NextResponse.json(
        {
          error:
            "Sync is not configured yet. Please complete the setup wizard first.",
        },
        { status: 400 }
      );
    }

    if (!session.spotifyUserId) {
      return NextResponse.json(
        { error: "Spotify user ID is missing. Please reconnect Spotify." },
        { status: 401 }
      );
    }

    const direction = syncConfig.direction ?? "spotify_to_youtube";

    // ── 2. Resolve OAuth app credentials ──────────────────────────────────
    const appCreds = await getResolvedCredentials();
    if (!appCreds) {
      return NextResponse.json(
        { error: "OAuth app credentials are not configured. Please complete setup." },
        { status: 500 }
      );
    }

    // ── 3. Parse request body ─────────────────────────────────────────────
    let body: { offset?: number; chunkSize?: number; force?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body is fine — use defaults
    }

    const offset = typeof body.offset === "number" ? Math.max(0, body.offset) : 0;
    const chunkSize =
      typeof body.chunkSize === "number"
        ? Math.min(Math.max(1, body.chunkSize), 50)
        : DEFAULT_CHUNK_SIZE;
    const force = body.force === true;

    // ── 4. Refresh Spotify token if needed ────────────────────────────────
    let spotifyToken = session.spotifyAccessToken!;
    {
      const probe = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      });
      if (probe.status === 401) {
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
        spotifyToken = refreshed.access_token;
        await session.save();
      }
    }

    // ── 5. Refresh YouTube token if needed ────────────────────────────────
    let youtubeToken = session.youtubeAccessToken!;
    {
      const probe = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
        { headers: { Authorization: `Bearer ${youtubeToken}` } }
      );
      if (probe.status === 401) {
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
        youtubeToken = refreshed.access_token;
        await session.save();
      }
    }

    // ── 5. Branch by direction ────────────────────────────────────────────

    if (direction === "spotify_to_youtube") {
      return await syncSpotifyToYouTube({
        session,
        spotifyToken,
        youtubeToken,
        syncConfig,
        offset,
        chunkSize,
        force,
      });
    } else {
      return await syncYouTubeToSpotify({
        session,
        spotifyToken,
        youtubeToken,
        syncConfig,
        offset,
        chunkSize,
        force,
      });
    }
  } catch (error) {
    console.error("[sync] Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred during sync. Please try again.",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Spotify → YouTube sync pipeline
// ---------------------------------------------------------------------------

async function syncSpotifyToYouTube({
  session,
  spotifyToken,
  youtubeToken,
  syncConfig,
  offset,
  chunkSize,
  force,
}: {
  session: Awaited<ReturnType<typeof getSession>>;
  spotifyToken: string;
  youtubeToken: string;
  syncConfig: NonNullable<typeof session.syncConfig>;
  offset: number;
  chunkSize: number;
  force: boolean;
}): Promise<NextResponse> {
  const userId = session.spotifyUserId!;

  // Fetch the full Spotify track list (stateless — re-fetched each chunk)
  const allTracks = syncConfig.isLikedSongs
    ? await getLikedSongs(spotifyToken)
    : await getPlaylistTracks(
        spotifyToken,
        syncConfig.spotifyPlaylistId ??
          (await findPlaylistByName(spotifyToken, syncConfig.spotifyPlaylist)) ??
          ""
      );

  if (allTracks.length === 0) {
    const empty: SyncChunkResult = {
      added: [], failed: [], notFound: [],
      done: true, progress: 100, total: 0, processed: 0,
    };
    return NextResponse.json(empty);
  }

  // Load already-synced URIs
  const syncedIds = force ? new Set<string>() : await getSyncedIds(userId, "spotify_to_youtube");
  const pendingTracks = allTracks.filter((t) => !syncedIds.has(t.uri));
  const total = allTracks.length;
  const totalPending = pendingTracks.length;

  if (totalPending === 0) {
    const done: SyncChunkResult = {
      added: [], failed: [], notFound: [],
      done: true, progress: 100, total, processed: total,
    };
    return NextResponse.json(done);
  }

  const chunk = pendingTracks.slice(offset, offset + chunkSize);
  const isDone = offset + chunkSize >= totalPending;

  // Resolve YouTube playlist ID
  let youtubePlaylistId = syncConfig.youtubePlaylistId;
  if (!youtubePlaylistId) {
    const result = await findOrCreatePlaylist(youtubeToken, syncConfig.youtubePlaylist);
    if (!result) {
      return NextResponse.json(
        { error: `Could not find or create YouTube playlist "${syncConfig.youtubePlaylist}".` },
        { status: 500 }
      );
    }
    youtubePlaylistId = result.id;
    session.syncConfig = { ...syncConfig, youtubePlaylistId };
    await session.save();
  }

  const added: SpotifyTrack[] = [];
  const failed: SpotifyTrack[] = [];
  const notFound: SpotifyTrack[] = [];
  const newlySyncedIds: string[] = [];

  for (const track of chunk) {
    const query = `${track.name} ${track.artist}`;

    try {
      await sleep(SEARCH_DELAY_MS);

      const searchResult = await searchVideo(youtubeToken, query);

      if (!searchResult) {
        notFound.push(track as SpotifyTrack);
        newlySyncedIds.push(track.uri);
        continue;
      }

      const ok = await addVideoToPlaylist(youtubeToken, youtubePlaylistId!, searchResult.videoId);

      if (ok) {
        added.push(track as SpotifyTrack);
        newlySyncedIds.push(track.uri);
      } else {
        failed.push(track as SpotifyTrack);
      }
    } catch (err: unknown) {
      const errMsg = String(err);

      if (errMsg.includes("quotaExceeded") || errMsg.includes("403") || errMsg.includes("QUOTA")) {
        if (newlySyncedIds.length > 0) {
          await addSyncedIds(userId, newlySyncedIds, "spotify_to_youtube");
        }
        return NextResponse.json(
          {
            error:
              "YouTube API quota exceeded for today. The quota resets at midnight Pacific Time. " +
              "Your progress has been saved — synced songs will not be duplicated next time.",
            quotaExceeded: true,
            partialResult: {
              added, failed, notFound,
              done: false,
              progress: Math.round(((offset + added.length) / totalPending) * 100),
              total,
              processed: offset + added.length,
            },
          },
          { status: 429 }
        );
      }

      console.error(`[sync sp→yt] Error for "${query}":`, err);
      failed.push(track as SpotifyTrack);
    }
  }

  if (newlySyncedIds.length > 0) {
    await addSyncedIds(userId, newlySyncedIds, "spotify_to_youtube");
  }

  const processed = offset + chunk.length;
  const alreadySyncedCount = total - totalPending;

  if (isDone) {
    const now = new Date().toISOString();

    await updateSyncStats(userId, {
      lastSyncTime: now,
      lastAdded: added.length,
      lastFailed: failed.length,
      addedCount: added.length,
    });

    const historyEntry: SyncHistoryEntry = {
      timestamp: now,
      added: added.length,
      failed: failed.length,
      direction: "spotify_to_youtube",
      tracks: [
        ...added.map((t) => ({
          sourceId: t.uri,
          spotifyUri: t.uri,
          trackName: t.name,
          artistName: t.artist,
          status: "added" as const,
        })),
        ...notFound.map((t) => ({
          sourceId: t.uri,
          spotifyUri: t.uri,
          trackName: t.name,
          artistName: t.artist,
          status: "not_found" as const,
        })),
        ...failed.map((t) => ({
          sourceId: t.uri,
          spotifyUri: t.uri,
          trackName: t.name,
          artistName: t.artist,
          status: "failed" as const,
        })),
      ],
    };

    await appendSyncHistory(userId, historyEntry);

    session.totalSynced = (session.totalSynced ?? 0) + added.length;
    session.lastSyncTime = now;
    await session.save();
  }

  const progressProcessed = alreadySyncedCount + processed;
  const progress = total > 0 ? Math.min(100, Math.round((progressProcessed / total) * 100)) : 100;

  const result: SyncChunkResult = {
    added,
    failed,
    notFound,
    done: isDone,
    progress,
    total,
    processed: progressProcessed,
  };

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// YouTube → Spotify sync pipeline
// ---------------------------------------------------------------------------

async function syncYouTubeToSpotify({
  session,
  spotifyToken,
  youtubeToken,
  syncConfig,
  offset,
  chunkSize,
  force,
}: {
  session: Awaited<ReturnType<typeof getSession>>;
  spotifyToken: string;
  youtubeToken: string;
  syncConfig: NonNullable<typeof session.syncConfig>;
  offset: number;
  chunkSize: number;
  force: boolean;
}): Promise<NextResponse> {
  const userId = session.spotifyUserId!;

  // Resolve YouTube source playlist ID
  let youtubePlaylistId = syncConfig.youtubePlaylistId;
  if (!youtubePlaylistId) {
    const result = await findOrCreatePlaylist(youtubeToken, syncConfig.youtubePlaylist);
    if (!result) {
      return NextResponse.json(
        { error: `Could not find YouTube playlist "${syncConfig.youtubePlaylist}".` },
        { status: 500 }
      );
    }
    youtubePlaylistId = result.id;
    session.syncConfig = { ...syncConfig, youtubePlaylistId };
    await session.save();
  }

  // Fetch all YouTube playlist items with metadata
  const allItems = await getPlaylistItems(youtubeToken, youtubePlaylistId!);

  if (allItems.length === 0) {
    const empty: SyncChunkResult = {
      added: [], failed: [], notFound: [],
      done: true, progress: 100, total: 0, processed: 0,
    };
    return NextResponse.json(empty);
  }

  // Load already-synced video IDs
  const syncedIds = force ? new Set<string>() : await getSyncedIds(userId, "youtube_to_spotify");
  const pendingItems = allItems.filter((item) => !syncedIds.has(item.videoId));
  const total = allItems.length;
  const totalPending = pendingItems.length;

  if (totalPending === 0) {
    const done: SyncChunkResult = {
      added: [], failed: [], notFound: [],
      done: true, progress: 100, total, processed: total,
    };
    return NextResponse.json(done);
  }

  const chunk = pendingItems.slice(offset, offset + chunkSize);
  const isDone = offset + chunkSize >= totalPending;

  // Resolve Spotify destination playlist ID
  let spotifyPlaylistId = syncConfig.spotifyPlaylistId;
  if (!spotifyPlaylistId) {
    const result = await findOrCreateSpotifyPlaylist(
      spotifyToken,
      userId,
      syncConfig.spotifyPlaylist
    );
    if (!result) {
      return NextResponse.json(
        {
          error: `Could not find or create Spotify playlist "${syncConfig.spotifyPlaylist}". ` +
            "You may need to reconnect Spotify to grant write access.",
        },
        { status: 500 }
      );
    }
    spotifyPlaylistId = result.id;
    session.syncConfig = { ...syncConfig, spotifyPlaylistId };
    await session.save();
  }

  const added: YouTubeTrack[] = [];
  const failed: YouTubeTrack[] = [];
  const notFound: YouTubeTrack[] = [];
  const newlySyncedIds: string[] = [];

  for (const item of chunk) {
    const ytTrack: YouTubeTrack = {
      videoId: item.videoId,
      title: item.title,
      channelTitle: item.channelTitle,
      thumbnailUrl: item.thumbnailUrl,
    };

    try {
      await sleep(SEARCH_DELAY_MS);

      // Clean the title before searching (strip "(Official Video)" etc.)
      const cleanedTitle = cleanYouTubeTitle(item.title);
      const query = item.channelTitle
        ? `${cleanedTitle} ${item.channelTitle}`
        : cleanedTitle;

      const searchResult = await searchSpotifyTrack(spotifyToken, query);

      if (!searchResult) {
        notFound.push(ytTrack);
        newlySyncedIds.push(item.videoId);
        continue;
      }

      const ok = await addTracksToSpotifyPlaylist(
        spotifyToken,
        spotifyPlaylistId!,
        [searchResult.uri]
      );

      if (ok) {
        added.push(ytTrack);
        newlySyncedIds.push(item.videoId);
      } else {
        failed.push(ytTrack);
      }
    } catch (err: unknown) {
      const errMsg = String(err);

      // Spotify 403 may indicate missing write scopes
      if (errMsg.includes("403") || errMsg.includes("Forbidden")) {
        if (newlySyncedIds.length > 0) {
          await addSyncedIds(userId, newlySyncedIds, "youtube_to_spotify");
        }
        return NextResponse.json(
          {
            error:
              "Spotify permission denied. Please reconnect Spotify in Setup to grant playlist write access, then try again.",
            details: errMsg,
          },
          { status: 403 }
        );
      }

      console.error(`[sync yt→sp] Error for "${item.title}":`, err);
      failed.push(ytTrack);
    }
  }

  if (newlySyncedIds.length > 0) {
    await addSyncedIds(userId, newlySyncedIds, "youtube_to_spotify");
  }

  const processed = offset + chunk.length;
  const alreadySyncedCount = total - totalPending;

  if (isDone) {
    const now = new Date().toISOString();

    await updateSyncStats(userId, {
      lastSyncTime: now,
      lastAdded: added.length,
      lastFailed: failed.length,
      addedCount: added.length,
    });

    const historyEntry: SyncHistoryEntry = {
      timestamp: now,
      added: added.length,
      failed: failed.length,
      direction: "youtube_to_spotify",
      tracks: [
        ...added.map((t) => ({
          sourceId: t.videoId,
          youtubeVideoId: t.videoId,
          trackName: t.title,
          artistName: t.channelTitle,
          status: "added" as const,
        })),
        ...notFound.map((t) => ({
          sourceId: t.videoId,
          youtubeVideoId: t.videoId,
          trackName: t.title,
          artistName: t.channelTitle,
          status: "not_found" as const,
        })),
        ...failed.map((t) => ({
          sourceId: t.videoId,
          youtubeVideoId: t.videoId,
          trackName: t.title,
          artistName: t.channelTitle,
          status: "failed" as const,
        })),
      ],
    };

    await appendSyncHistory(userId, historyEntry);

    session.totalSynced = (session.totalSynced ?? 0) + added.length;
    session.lastSyncTime = now;
    await session.save();
  }

  const progressProcessed = alreadySyncedCount + processed;
  const progress = total > 0 ? Math.min(100, Math.round((progressProcessed / total) * 100)) : 100;

  const result: SyncChunkResult = {
    added,
    failed,
    notFound,
    done: isDone,
    progress,
    total,
    processed: progressProcessed,
  };

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// GET /api/sync — quick status endpoint (does not run a sync)
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await getSession();

    const configured = Boolean(
      isSpotifyConnected(session) &&
        isYouTubeConnected(session) &&
        session.syncConfig
    );

    return NextResponse.json({
      configured,
      spotifyConnected: isSpotifyConnected(session),
      youtubeConnected: isYouTubeConnected(session),
      syncConfig: session.syncConfig ?? null,
      direction: session.syncConfig?.direction ?? "spotify_to_youtube",
      totalSynced: session.totalSynced ?? 0,
      lastSyncTime: session.lastSyncTime ?? null,
    });
  } catch (error) {
    console.error("[sync GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sync status." },
      { status: 500 }
    );
  }
}
