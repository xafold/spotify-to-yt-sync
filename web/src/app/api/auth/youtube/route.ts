import { NextResponse } from "next/server";
import { getYouTubeAuthUrl } from "@/lib/youtube";

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/youtube/callback`;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error: "Missing Google credentials",
        details:
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your environment variables.",
      },
      { status: 500 }
    );
  }

  const authUrl = getYouTubeAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
