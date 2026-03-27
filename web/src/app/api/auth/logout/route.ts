import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { clearUserData } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getSession();
    const userId = session.spotifyUserId;

    // Clear all KV data for this user if we have their ID
    if (userId) {
      try {
        await clearUserData(userId);
      } catch (err) {
        // KV might not be configured — not a fatal error
        console.warn("[logout] Could not clear KV data:", err);
      }
    }

    // Destroy the session cookie
    session.destroy();

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/?logged_out=true`);
  } catch (error) {
    console.error("[logout] Error:", error);
    return NextResponse.json(
      { error: "Failed to log out" },
      { status: 500 }
    );
  }
}

// Also support GET for simple link-based logout
export async function GET() {
  return POST();
}
