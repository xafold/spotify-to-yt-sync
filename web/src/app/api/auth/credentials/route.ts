import { NextRequest, NextResponse } from "next/server";
import { getAppCredentials, saveAppCredentials } from "@/lib/kv";

export const dynamic = "force-dynamic";

/** GET — return whether credentials are configured (never return the values) */
export async function GET() {
  const creds = await getAppCredentials();
  return NextResponse.json({
    configured: !!(
      creds?.spotifyClientId &&
      creds?.spotifyClientSecret &&
      creds?.googleClientId &&
      creds?.googleClientSecret
    ),
    savedAt: creds?.savedAt ?? null,
  });
}

/** POST — save credentials from the setup UI */
export async function POST(request: NextRequest) {
  let body: Record<string, string> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { spotifyClientId, spotifyClientSecret, googleClientId, googleClientSecret } = body;

  const missing = [];
  if (!spotifyClientId?.trim()) missing.push("spotifyClientId");
  if (!spotifyClientSecret?.trim()) missing.push("spotifyClientSecret");
  if (!googleClientId?.trim()) missing.push("googleClientId");
  if (!googleClientSecret?.trim()) missing.push("googleClientSecret");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", fields: missing },
      { status: 400 }
    );
  }

  await saveAppCredentials({
    spotifyClientId: spotifyClientId.trim(),
    spotifyClientSecret: spotifyClientSecret.trim(),
    googleClientId: googleClientId.trim(),
    googleClientSecret: googleClientSecret.trim(),
    savedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
