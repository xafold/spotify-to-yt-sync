import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeYouTubeCode, getYouTubeChannel } from "@/lib/youtube";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/youtube/callback`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // User denied access
  if (error || !code) {
    const reason = error ?? "no_code";
    return NextResponse.redirect(
      `${appUrl}/setup?error=youtube_denied&reason=${encodeURIComponent(reason)}`
    );
  }

  // Resolve credentials
  const creds = await getResolvedCredentials();
  if (!creds) {
    return NextResponse.redirect(`${appUrl}/setup?error=missing_credentials`);
  }

  // Exchange the code for tokens
  const tokens = await exchangeYouTubeCode(code, redirectUri, {
    clientId: creds.googleClientId,
    clientSecret: creds.googleClientSecret,
  });

  if (!tokens?.access_token || !tokens?.refresh_token) {
    return NextResponse.redirect(
      `${appUrl}/setup?error=youtube_token_exchange_failed`
    );
  }

  // Fetch YouTube channel info
  const channel = await getYouTubeChannel(tokens.access_token);

  if (!channel) {
    return NextResponse.redirect(
      `${appUrl}/setup?error=youtube_channel_failed`
    );
  }

  // Persist tokens + channel info in encrypted session cookie
  const session = await getSession();
  session.youtubeAccessToken = tokens.access_token;
  session.youtubeRefreshToken = tokens.refresh_token;
  session.youtubeChannelId = channel.id;
  session.youtubeDisplayName = channel.title;
  session.youtubeAvatarUrl = channel.thumbnailUrl;
  await session.save();

  // Redirect back to the setup wizard with success flag
  return NextResponse.redirect(`${appUrl}/setup?youtube=connected`);
}
