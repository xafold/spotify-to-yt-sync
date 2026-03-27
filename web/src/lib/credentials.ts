/**
 * Credential resolution — server-side only.
 *
 * Resolution order:
 * 1. Environment variables (for deployments that set them directly)
 * 2. Session cookie (saved when the user completes Step 0 — survives serverless cold starts)
 * 3. Vercel KV (persistent across devices, requires KV to be configured)
 *
 * Never import this file from "use client" components.
 */

import { getAppCredentials } from "@/lib/kv";
import { getSession } from "@/lib/session";

export interface ResolvedCredentials {
  spotifyClientId: string;
  spotifyClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}

/**
 * Returns resolved credentials from env vars, session, or KV storage.
 * Returns null if credentials are not configured in any of these places.
 */
export async function getResolvedCredentials(): Promise<ResolvedCredentials | null> {
  // 1. Environment variables (highest priority)
  if (
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  ) {
    return {
      spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
      spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  // 2. Session cookie — set when user saves credentials in Step 0
  //    This works even without Vercel KV because the cookie travels with every request
  try {
    const session = await getSession();
    if (
      session.appSpotifyClientId &&
      session.appSpotifyClientSecret &&
      session.appGoogleClientId &&
      session.appGoogleClientSecret
    ) {
      return {
        spotifyClientId: session.appSpotifyClientId,
        spotifyClientSecret: session.appSpotifyClientSecret,
        googleClientId: session.appGoogleClientId,
        googleClientSecret: session.appGoogleClientSecret,
      };
    }
  } catch {
    // Session read failed (e.g. SESSION_SECRET missing in dev) — continue to KV
  }

  // 3. Vercel KV (persistent across devices/sessions when configured)
  const kv = await getAppCredentials();
  if (
    kv?.spotifyClientId &&
    kv?.spotifyClientSecret &&
    kv?.googleClientId &&
    kv?.googleClientSecret
  ) {
    return {
      spotifyClientId: kv.spotifyClientId,
      spotifyClientSecret: kv.spotifyClientSecret,
      googleClientId: kv.googleClientId,
      googleClientSecret: kv.googleClientSecret,
    };
  }

  return null;
}
