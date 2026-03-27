/**
 * Credential resolution — server-side only.
 *
 * Tries environment variables first (for existing Vercel deployments that
 * already have env vars set), then falls back to credentials saved in KV via
 * the setup UI. Never import this file from "use client" components.
 */

import { getAppCredentials } from "@/lib/kv";

export interface ResolvedCredentials {
  spotifyClientId: string;
  spotifyClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}

/**
 * Returns resolved credentials from env vars or KV storage.
 * Returns null if credentials are not configured in either place.
 */
export async function getResolvedCredentials(): Promise<ResolvedCredentials | null> {
  const spotifyClientId =
    process.env.SPOTIFY_CLIENT_ID ||
    null;
  const spotifyClientSecret =
    process.env.SPOTIFY_CLIENT_SECRET ||
    null;
  const googleClientId =
    process.env.GOOGLE_CLIENT_ID ||
    null;
  const googleClientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    null;

  // If all four env vars are present, use them (zero KV reads).
  if (spotifyClientId && spotifyClientSecret && googleClientId && googleClientSecret) {
    return { spotifyClientId, spotifyClientSecret, googleClientId, googleClientSecret };
  }

  // Fall back to KV-stored credentials.
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
