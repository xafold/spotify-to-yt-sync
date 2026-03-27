import { NextResponse } from "next/server";
import { getSpotifyAuthUrl } from "@/lib/spotify";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/spotify/callback`;

  const creds = await getResolvedCredentials();
  if (!creds) {
    return NextResponse.redirect(`${appUrl}/setup?error=missing_credentials`);
  }

  const authUrl = getSpotifyAuthUrl(redirectUri, {
    clientId: creds.spotifyClientId,
    clientSecret: creds.spotifyClientSecret,
  });
  return NextResponse.redirect(authUrl);
}
