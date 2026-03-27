import { NextResponse } from "next/server";
import { getSession, isSpotifyConnected, isYouTubeConnected } from "@/lib/session";
import { getSyncStats } from "@/lib/kv";
import type { AuthStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    const spotifyConnected = isSpotifyConnected(session);
    const youtubeConnected = isYouTubeConnected(session);

    let stats = { totalSynced: 0, lastSyncTime: null as string | null };

    if (spotifyConnected && session.spotifyUserId) {
      try {
        const kvStats = await getSyncStats(session.spotifyUserId);
        stats = {
          totalSynced: kvStats.totalSynced,
          lastSyncTime: kvStats.lastSyncTime,
        };
      } catch {
        // KV might not be configured — fall back to session values
        stats = {
          totalSynced: session.totalSynced ?? 0,
          lastSyncTime: session.lastSyncTime ?? null,
        };
      }
    }

    const status: AuthStatus = {
      spotify: {
        connected: spotifyConnected,
        displayName: session.spotifyDisplayName,
        avatarUrl: session.spotifyAvatarUrl,
        userId: session.spotifyUserId,
      },
      youtube: {
        connected: youtubeConnected,
        displayName: session.youtubeDisplayName,
        avatarUrl: session.youtubeAvatarUrl,
        channelId: session.youtubeChannelId,
      },
      syncConfig: session.syncConfig,
      totalSynced: stats.totalSynced,
      lastSyncTime: stats.lastSyncTime ?? undefined,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("[auth/status] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve auth status" },
      { status: 500 }
    );
  }
}
