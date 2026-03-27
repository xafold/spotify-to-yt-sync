import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAuthUrl } from "@/lib/spotify";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/spotify/callback`;

  const creds = await getResolvedCredentials();
  if (!creds) {
    return NextResponse.redirect(`${origin}/setup?error=missing_credentials`);
  }

  const authUrl = getSpotifyAuthUrl(redirectUri, {
    clientId: creds.spotifyClientId,
    clientSecret: creds.spotifyClientSecret,
  });
  return NextResponse.redirect(authUrl);
}
