/**
 * KV Storage Abstraction
 *
 * Uses Vercel KV (Redis) when the KV_REST_API_URL environment variable is set.
 * Falls back to a simple in-memory store for local development so the app works
 * without any external services.
 *
 * Keys used:
 *   synced:{userId}          → string[]   Spotify URIs already synced (sp→yt)
 *   synced-yt2sp:{userId}    → string[]   YouTube video IDs already synced (yt→sp)
 *   config:{userId}          → SyncConfig  user's sync configuration
 *   history:{userId}         → SyncHistoryEntry[]  last 50 sync runs (newest first)
 *   stats:{userId}           → { totalSynced, lastSyncTime, lastAdded, lastFailed }
 */

import type { SyncConfig, SyncHistoryEntry, SyncDirection } from "@/types";

// ---------------------------------------------------------------------------
// In-memory fallback (used when Vercel KV is not configured)
// ---------------------------------------------------------------------------

const memStore = new Map<string, unknown>();

function memGet<T>(key: string): T | null {
  return (memStore.get(key) as T) ?? null;
}

function memSet(key: string, value: unknown): void {
  memStore.set(key, value);
}

function memDel(key: string): void {
  memStore.delete(key);
}

// ---------------------------------------------------------------------------
// KV adapter — transparently switches between Vercel KV and in-memory
// ---------------------------------------------------------------------------

async function kvGet<T>(key: string): Promise<T | null> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      return await kv.get<T>(key);
    } catch (err) {
      console.warn("[KV] get failed, falling back to memory:", err);
    }
  }
  return memGet<T>(key);
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(key, value);
      return;
    } catch (err) {
      console.warn("[KV] set failed, falling back to memory:", err);
    }
  }
  memSet(key, value);
}

async function kvDel(key: string): Promise<void> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.del(key);
      return;
    } catch (err) {
      console.warn("[KV] del failed, falling back to memory:", err);
    }
  }
  memDel(key);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// ── Synced track URIs ────────────────────────────────────────────────────────

/** Returns the set of Spotify track URIs that have already been synced. */
export async function getSyncedUris(userId: string): Promise<Set<string>> {
  const uris = await kvGet<string[]>(`synced:${userId}`);
  return new Set(uris ?? []);
}

/** Persists the updated set of synced Spotify track URIs. */
export async function saveSyncedUris(
  userId: string,
  uris: Set<string>
): Promise<void> {
  await kvSet(`synced:${userId}`, Array.from(uris));
}

/** Adds a batch of new URIs to the persisted set and saves. */
export async function addSyncedUris(
  userId: string,
  newUris: string[]
): Promise<void> {
  const existing = await getSyncedUris(userId);
  for (const uri of newUris) existing.add(uri);
  await saveSyncedUris(userId, existing);
}

/** Returns true if this Spotify track URI has already been synced. */
export async function isAlreadySynced(
  userId: string,
  uri: string
): Promise<boolean> {
  const uris = await getSyncedUris(userId);
  return uris.has(uri);
}

// ── Direction-aware synced ID helpers ────────────────────────────────────────

function syncedKey(userId: string, direction: SyncDirection): string {
  return direction === "youtube_to_spotify"
    ? `synced-yt2sp:${userId}`
    : `synced:${userId}`;
}

/** Returns the set of IDs already synced for the given direction. */
export async function getSyncedIds(
  userId: string,
  direction: SyncDirection = "spotify_to_youtube"
): Promise<Set<string>> {
  const ids = await kvGet<string[]>(syncedKey(userId, direction));
  return new Set(ids ?? []);
}

/** Persists the updated set of synced IDs for the given direction. */
export async function saveSyncedIds(
  userId: string,
  ids: Set<string>,
  direction: SyncDirection = "spotify_to_youtube"
): Promise<void> {
  await kvSet(syncedKey(userId, direction), Array.from(ids));
}

/** Adds new IDs to the persisted set for the given direction. */
export async function addSyncedIds(
  userId: string,
  newIds: string[],
  direction: SyncDirection = "spotify_to_youtube"
): Promise<void> {
  const existing = await getSyncedIds(userId, direction);
  for (const id of newIds) existing.add(id);
  await saveSyncedIds(userId, existing, direction);
}

// ── Sync config ──────────────────────────────────────────────────────────────

export async function getSyncConfig(
  userId: string
): Promise<SyncConfig | null> {
  return kvGet<SyncConfig>(`config:${userId}`);
}

export async function saveSyncConfig(
  userId: string,
  config: SyncConfig
): Promise<void> {
  await kvSet(`config:${userId}`, config);
}

export async function deleteSyncConfig(userId: string): Promise<void> {
  await kvDel(`config:${userId}`);
}

// ── Sync history ─────────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

export async function getSyncHistory(
  userId: string
): Promise<SyncHistoryEntry[]> {
  const history = await kvGet<SyncHistoryEntry[]>(`history:${userId}`);
  return history ?? [];
}

export async function appendSyncHistory(
  userId: string,
  entry: SyncHistoryEntry
): Promise<void> {
  const history = await getSyncHistory(userId);
  // Prepend newest entry and cap at MAX_HISTORY
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  await kvSet(`history:${userId}`, updated);
}

export async function clearSyncHistory(userId: string): Promise<void> {
  await kvDel(`history:${userId}`);
}

// ── Sync stats ───────────────────────────────────────────────────────────────

export interface SyncStats {
  totalSynced: number;
  lastSyncTime: string | null;
  lastAdded: number;
  lastFailed: number;
}

const DEFAULT_STATS: SyncStats = {
  totalSynced: 0,
  lastSyncTime: null,
  lastAdded: 0,
  lastFailed: 0,
};

export async function getSyncStats(userId: string): Promise<SyncStats> {
  const stats = await kvGet<SyncStats>(`stats:${userId}`);
  return stats ?? { ...DEFAULT_STATS };
}

export async function updateSyncStats(
  userId: string,
  delta: Partial<Omit<SyncStats, "totalSynced">> & { addedCount?: number }
): Promise<SyncStats> {
  const current = await getSyncStats(userId);

  const updated: SyncStats = {
    totalSynced: current.totalSynced + (delta.addedCount ?? 0),
    lastSyncTime: delta.lastSyncTime ?? current.lastSyncTime,
    lastAdded: delta.lastAdded ?? current.lastAdded,
    lastFailed: delta.lastFailed ?? current.lastFailed,
  };

  await kvSet(`stats:${userId}`, updated);
  return updated;
}

export async function resetSyncStats(userId: string): Promise<void> {
  await kvSet(`stats:${userId}`, { ...DEFAULT_STATS });
}

// ── Full user data reset ──────────────────────────────────────────────────────

/** Clears ALL stored data for a user (used on logout / disconnect). */
export async function clearUserData(userId: string): Promise<void> {
  await Promise.all([
    kvDel(`synced:${userId}`),
    kvDel(`synced-yt2sp:${userId}`),
    kvDel(`config:${userId}`),
    kvDel(`history:${userId}`),
    kvDel(`stats:${userId}`),
  ]);
}

// ── KV health check ───────────────────────────────────────────────────────────

/** Returns true if Vercel KV is configured and reachable. */
export async function isKvAvailable(): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return false;
  }
  try {
    const { kv } = await import("@vercel/kv");
    await kv.ping();
    return true;
  } catch {
    return false;
  }
}
