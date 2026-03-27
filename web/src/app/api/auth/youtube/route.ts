import { NextRequest, NextResponse } from "next/server";
import { getYouTubeAuthUrl } from "@/lib/youtube";
import { getResolvedCredentials } from "@/lib/credentials";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/youtube/callback`;

  const creds = await getResolvedCredentials();
  if (!creds) {
    return NextResponse.redirect(`${origin}/setup?error=missing_credentials`);
  }

  const authUrl = getYouTubeAuthUrl(redirectUri, {
    clientId: creds.googleClientId,
    clientSecret: creds.googleClientSecret,
  });
  return NextResponse.redirect(authUrl);
}
