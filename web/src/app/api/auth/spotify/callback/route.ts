import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeSpotifyCode, getSpotifyUser } from "@/lib/spotify";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/spotify/callback`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // User denied access
  if (error || !code) {
    const reason = error ?? "no_code";
    return NextResponse.redirect(
      `${origin}/setup?error=spotify_denied&reason=${encodeURIComponent(reason)}`
    );
  }

  // Resolve credentials
  const creds = await getResolvedCredentials();
  if (!creds) {
    return NextResponse.redirect(`${origin}/setup?error=missing_credentials`);
  }

  // Exchange the code for tokens
  const tokens = await exchangeSpotifyCode(code, redirectUri, {
    clientId: creds.spotifyClientId,
    clientSecret: creds.spotifyClientSecret,
  });

  if (!tokens?.access_token || !tokens?.refresh_token) {
    return NextResponse.redirect(
      `${origin}/setup?error=spotify_token_exchange_failed`
    );
  }

  // Fetch Spotify user profile
  const user = await getSpotifyUser(tokens.access_token);

  if (!user) {
    return NextResponse.redirect(
      `${origin}/setup?error=spotify_profile_failed`
    );
  }

  // Persist tokens + profile in encrypted session cookie
  const session = await getSession();
  session.spotifyAccessToken = tokens.access_token;
  session.spotifyRefreshToken = tokens.refresh_token;
  session.spotifyUserId = user.id;
  session.spotifyDisplayName = user.display_name;
  session.spotifyAvatarUrl = user.images?.[0]?.url;
  await session.save();

  // Redirect back to the setup wizard with success flag
  return NextResponse.redirect(`${origin}/setup?spotify=connected`);
}
