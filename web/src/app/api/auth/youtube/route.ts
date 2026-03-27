import { NextResponse } from "next/server";
import { getYouTubeAuthUrl } from "@/lib/youtube";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/youtube/callback`;

  const creds = await getResolvedCredentials();
  if (!creds) {
    return NextResponse.redirect(`${appUrl}/setup?error=missing_credentials`);
  }

  const authUrl = getYouTubeAuthUrl(redirectUri, {
    clientId: creds.googleClientId,
    clientSecret: creds.googleClientSecret,
  });
  return NextResponse.redirect(authUrl);
}
