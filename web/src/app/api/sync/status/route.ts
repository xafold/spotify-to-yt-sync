import { NextResponse } from "next/server";
import { getSession, isSpotifyConnected, isYouTubeConnected } from "@/lib/session";
import { getSyncStats, getSyncHistory, isKvAvailable } from "@/lib/kv";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/sync/status
//
// Returns the current sync status, stats, and recent history for the
// authenticated user.
//
// Response shape:
// {
//   configured: boolean,
//   spotifyConnected: boolean,
//   youtubeConnected: boolean,
//   syncConfig: SyncConfig | null,
//   stats: {
//     totalSynced: number,
//     lastSyncTime: string | null,
//     lastAdded: number,
//     lastFailed: number,
//   },
//   history: SyncHistoryEntry[],   // newest first, last 50 entries
//   kvAvailable: boolean,          // whether Vercel KV is configured
// }
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await getSession();

    const spotifyConnected = isSpotifyConnected(session);
    const youtubeConnected = isYouTubeConnected(session);
    const configured = Boolean(
      spotifyConnected && youtubeConnected && session.syncConfig
    );

    // Check KV availability (non-blocking — we always fall back gracefully)
    const kvAvailable = await isKvAvailable().catch(() => false);

    // Default stats (used if KV is not available or user is not identified)
    let stats = {
      totalSynced: session.totalSynced ?? 0,
      lastSyncTime: session.lastSyncTime ?? null,
      lastAdded: 0,
      lastFailed: 0,
    };

    let history: Awaited<ReturnType<typeof getSyncHistory>> = [];

    // Pull richer data from KV when available
    if (spotifyConnected && session.spotifyUserId) {
      try {
        const [kvStats, kvHistory] = await Promise.all([
          getSyncStats(session.spotifyUserId),
          getSyncHistory(session.spotifyUserId),
        ]);

        stats = {
          totalSynced: kvStats.totalSynced,
          lastSyncTime: kvStats.lastSyncTime,
          lastAdded: kvStats.lastAdded,
          lastFailed: kvStats.lastFailed,
        };

        history = kvHistory;
      } catch (err) {
        // KV unavailable — log a warning but continue with session fallback
        console.warn("[sync/status] KV unavailable, using session fallback:", err);
      }
    }

    // Build a human-readable "next sync" estimate based on the interval setting
    let nextSyncTime: string | null = null;
    if (stats.lastSyncTime && session.syncConfig?.intervalSeconds) {
      const lastMs = new Date(stats.lastSyncTime).getTime();
      const intervalMs = session.syncConfig.intervalSeconds * 1000;
      nextSyncTime = new Date(lastMs + intervalMs).toISOString();
    }

    return NextResponse.json({
      configured,
      spotifyConnected,
      youtubeConnected,
      syncConfig: session.syncConfig ?? null,
      direction: session.syncConfig?.direction ?? "spotify_to_youtube",
      stats,
      nextSyncTime,
      history,
      kvAvailable,
      // Surface a short summary of the latest sync for quick display
      latestSync: history[0] ?? null,
    });
  } catch (error) {
    console.error("[sync/status] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve sync status." },
      { status: 500 }
    );
  }
}
