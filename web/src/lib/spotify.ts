const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export function getSpotifyAuthUrl(redirectUri: string): string {
  const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "playlist-modify-private",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    show_dialog: "false",
  });

  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCode(
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    console.error("Spotify token exchange failed:", await response.text());
    return null;
  }

  return response.json();
}

export async function refreshSpotifyToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    console.error("Spotify token refresh failed:", await response.text());
    return null;
  }

  return response.json();
}

export async function getSpotifyUser(accessToken: string): Promise<{
  id: string;
  display_name: string;
  images: Array<{ url: string }>;
} | null> {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function getUserPlaylists(accessToken: string): Promise<
  Array<{
    id: string;
    name: string;
    tracks: { total: number };
    images: Array<{ url: string }>;
    public: boolean;
  }>
> {
  const playlists: Array<{
    id: string;
    name: string;
    tracks: { total: number };
    images: Array<{ url: string }>;
    public: boolean;
  }> = [];

  let url: string | null = `${SPOTIFY_API_URL}/me/playlists?limit=50`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) break;

    const data = (await response.json()) as {
      items?: typeof playlists;
      next?: string | null;
    };
    playlists.push(...(data.items ?? []));
    url = data.next ?? null;
  }

  return playlists;
}

export async function getLikedSongs(
  accessToken: string,
  afterDate?: string,
): Promise<
  Array<{
    uri: string;
    name: string;
    artist: string;
    albumArt?: string;
    addedAt: string;
  }>
> {
  const tracks: Array<{
    uri: string;
    name: string;
    artist: string;
    albumArt?: string;
    addedAt: string;
  }> = [];

  let url: string | null = `${SPOTIFY_API_URL}/me/tracks?limit=50`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) break;

    const data = (await response.json()) as {
      items?: Array<{
        track: {
          uri: string;
          name: string;
          artists: Array<{ name: string }>;
          album: { images: Array<{ url: string }> };
        };
        added_at: string;
      }>;
      next?: string | null;
    };

    for (const item of data.items ?? []) {
      const track = item?.track;
      if (!track?.name) continue;

      // If afterDate provided, stop once we hit older entries
      // (Liked Songs are returned newest-first)
      if (afterDate && item.added_at <= afterDate) {
        return tracks;
      }

      tracks.push({
        uri: track.uri,
        name: track.name,
        artist:
          track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "",
        albumArt:
          track.album?.images?.[1]?.url ?? track.album?.images?.[0]?.url,
        addedAt: item.added_at,
      });
    }

    url = data.next ?? null;
  }

  return tracks;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<
  Array<{
    uri: string;
    name: string;
    artist: string;
    albumArt?: string;
    addedAt: string;
  }>
> {
  const tracks: Array<{
    uri: string;
    name: string;
    artist: string;
    albumArt?: string;
    addedAt: string;
  }> = [];

  let url: string | null =
    `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks?limit=100&fields=next,items(added_at,track(uri,name,artists(name),album(images)))`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) break;

    const data = (await response.json()) as {
      items?: Array<{
        track: {
          uri: string;
          name: string;
          artists: Array<{ name: string }>;
          album: { images: Array<{ url: string }> };
        };
        added_at: string;
      }>;
      next?: string | null;
    };

    for (const item of data.items ?? []) {
      const track = item?.track;
      if (!track?.name) continue;

      tracks.push({
        uri: track.uri,
        name: track.name,
        artist:
          track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "",
        albumArt:
          track.album?.images?.[1]?.url ?? track.album?.images?.[0]?.url,
        addedAt: item.added_at,
      });
    }

    url = data.next ?? null;
  }

  return tracks;
}

export async function findPlaylistByName(
  accessToken: string,
  name: string,
): Promise<string | null> {
  const playlists = await getUserPlaylists(accessToken);
  const match = playlists.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  return match?.id ?? null;
}

// ---------------------------------------------------------------------------
// Write helpers (used for YouTube → Spotify direction)
// ---------------------------------------------------------------------------

/**
 * Strip common YouTube title suffixes to improve Spotify search accuracy.
 * e.g. "Song Name (Official Music Video)" → "Song Name"
 */
export function cleanYouTubeTitle(title: string): string {
  return title
    .replace(
      /\s*[\(\[](official\s*(music\s*)?video|official\s*audio|lyrics?|audio|live|visualizer|topic|hd|4k|explicit)[\)\]]/gi,
      "",
    )
    .replace(/\s*\|\s*official\s*(music\s*)?video/gi, "")
    .replace(/\s*-\s*topic$/gi, "")
    .replace(/\s*[\(\[].*?[\)\]]/g, "") // strip any remaining parenthetical
    .trim();
}

/**
 * Search the Spotify catalog for a track.
 * Returns the best match or null if not found.
 */
export async function searchSpotifyTrack(
  accessToken: string,
  query: string,
): Promise<{ uri: string; name: string; artist: string } | null> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "1",
  });

  const response = await fetch(`${SPOTIFY_API_URL}/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const track = data.tracks?.items?.[0];
  if (!track) return null;

  return {
    uri: track.uri,
    name: track.name,
    artist: track.artists?.map((a: { name: string }) => a.name).join(", ") ?? "",
  };
}

/**
 * Add track URIs to a Spotify playlist (up to 100 per call).
 */
export async function addTracksToSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<boolean> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
    },
  );

  if (!response.ok) {
    console.error("Failed to add tracks to Spotify playlist:", await response.text());
    return false;
  }

  return true;
}

/**
 * Create a new private Spotify playlist for the given user.
 * Returns the new playlist ID or null on failure.
 */
export async function createSpotifyPlaylist(
  accessToken: string,
  userId: string,
  name: string,
): Promise<string | null> {
  const response = await fetch(
    `${SPOTIFY_API_URL}/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, public: false }),
    },
  );

  if (!response.ok) {
    console.error("Failed to create Spotify playlist:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.id ?? null;
}

/**
 * Find a Spotify playlist by name or create it if it doesn't exist.
 */
export async function findOrCreateSpotifyPlaylist(
  accessToken: string,
  userId: string,
  name: string,
): Promise<{ id: string; created: boolean } | null> {
  const existingId = await findPlaylistByName(accessToken, name);
  if (existingId) return { id: existingId, created: false };

  const newId = await createSpotifyPlaylist(accessToken, userId, name);
  if (!newId) return null;

  return { id: newId, created: true };
}
