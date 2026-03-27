import { NextResponse } from "next/server";
import { getSpotifyAuthUrl } from "@/lib/spotify";

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/spotify/callback`;

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error: "Missing Spotify credentials",
        details:
          "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in your environment variables.",
      },
      { status: 500 }
    );
  }

  const authUrl = getSpotifyAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
