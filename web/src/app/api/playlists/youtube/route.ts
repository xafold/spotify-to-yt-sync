import { NextResponse } from "next/server";
import { getSession, isYouTubeConnected } from "@/lib/session";
import { getUserPlaylists, refreshYouTubeToken } from "@/lib/youtube";
import { getResolvedCredentials } from "@/lib/credentials";
import type { YouTubePlaylist } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!isYouTubeConnected(session)) {
      return NextResponse.json(
        { error: "YouTube not connected" },
        { status: 401 }
      );
    }

    let accessToken = session.youtubeAccessToken!;

    let playlists = await getUserPlaylists(accessToken);

    if (!playlists || playlists.length === 0) {
      // Attempt token refresh and retry
      const appCreds = await getResolvedCredentials();
      if (!appCreds) {
        return NextResponse.json({ error: "OAuth credentials not configured." }, { status: 500 });
      }
      const refreshed = await refreshYouTubeToken(session.youtubeRefreshToken!, {
        clientId: appCreds.googleClientId,
        clientSecret: appCreds.googleClientSecret,
      });
      if (!refreshed?.access_token) {
        return NextResponse.json(
          { error: "YouTube session expired. Please reconnect." },
          { status: 401 }
        );
      }
      session.youtubeAccessToken = refreshed.access_token;
      await session.save();
      accessToken = refreshed.access_token;
      playlists = await getUserPlaylists(accessToken);
    }

    const result: YouTubePlaylist[] = (playlists ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      videoCount: p.videoCount ?? 0,
      thumbnailUrl: p.thumbnailUrl,
    }));

    return NextResponse.json({ playlists: result });
  } catch (error) {
    console.error("[playlists/youtube] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch YouTube playlists" },
      { status: 500 }
    );
  }
}
