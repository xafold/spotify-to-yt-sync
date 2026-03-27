import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData } from "@/types";

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "syt-sync-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session;
}

export async function getSessionData(): Promise<SessionData> {
  const session = await getSession();
  return { ...session };
}

export function isSpotifyConnected(session: SessionData): boolean {
  return Boolean(
    session.spotifyAccessToken && session.spotifyRefreshToken
  );
}

export function isYouTubeConnected(session: SessionData): boolean {
  return Boolean(
    session.youtubeAccessToken && session.youtubeRefreshToken
  );
}

export function isFullyConfigured(session: SessionData): boolean {
  return (
    isSpotifyConnected(session) &&
    isYouTubeConnected(session) &&
    Boolean(session.syncConfig)
  );
}
