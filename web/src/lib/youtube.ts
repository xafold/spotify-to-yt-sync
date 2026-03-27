const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

export function getYouTubeAuthUrl(redirectUri: string): string {
  const scopes = ["https://www.googleapis.com/auth/youtube"].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent", // force refresh_token every time
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeYouTubeCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!response.ok) {
    console.error("YouTube token exchange failed:", await response.text());
    return null;
  }

  return response.json();
}

export async function refreshYouTubeToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("YouTube token refresh failed:", await response.text());
    return null;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Channel / user info
// ---------------------------------------------------------------------------

export async function getYouTubeChannel(accessToken: string): Promise<{
  id: string;
  title: string;
  thumbnailUrl?: string;
} | null> {
  const params = new URLSearchParams({
    part: "snippet",
    mine: "true",
  });

  const response = await fetch(`${YOUTUBE_API_URL}/channels?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const channel = data.items?.[0];
  if (!channel) return null;

  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url,
  };
}

// ---------------------------------------------------------------------------
// Playlist helpers
// ---------------------------------------------------------------------------

export async function getUserPlaylists(
  accessToken: string
): Promise<
  Array<{
    id: string;
    title: string;
    videoCount: number;
    thumbnailUrl?: string;
  }>
> {
  const playlists: Array<{
    id: string;
    title: string;
    videoCount: number;
    thumbnailUrl?: string;
  }> = [];

  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      mine: "true",
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await fetch(`${YOUTUBE_API_URL}/playlists?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) break;

    const data = await response.json();

    for (const item of data.items ?? []) {
      playlists.push({
        id: item.id,
        title: item.snippet.title,
        videoCount: item.contentDetails?.itemCount ?? 0,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return playlists;
}

export async function findPlaylistByName(
  accessToken: string,
  name: string
): Promise<string | null> {
  const playlists = await getUserPlaylists(accessToken);
  const match = playlists.find(
    (p) => p.title.trim().toLowerCase() === name.trim().toLowerCase()
  );
  return match?.id ?? null;
}

export async function createPlaylist(
  accessToken: string,
  title: string,
  privacyStatus: "public" | "private" | "unlisted" = "public"
): Promise<string | null> {
  const response = await fetch(`${YOUTUBE_API_URL}/playlists?part=snippet,status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: { title },
      status: { privacyStatus },
    }),
  });

  if (!response.ok) {
    console.error("Failed to create YouTube playlist:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.id ?? null;
}

export async function findOrCreatePlaylist(
  accessToken: string,
  name: string
): Promise<{ id: string; created: boolean } | null> {
  const existingId = await findPlaylistByName(accessToken, name);
  if (existingId) return { id: existingId, created: false };

  const newId = await createPlaylist(accessToken, name);
  if (!newId) return null;

  return { id: newId, created: true };
}

// ---------------------------------------------------------------------------
// Video search
// ---------------------------------------------------------------------------

export interface SearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl?: string;
}

/**
 * Search YouTube for a video matching the query.
 * Tries the Music category (10) first; falls back to an unrestricted search.
 * Returns the top result or null if nothing is found.
 */
export async function searchVideo(
  accessToken: string,
  query: string
): Promise<SearchResult | null> {
  // --- Attempt 1: music category ---
  const musicParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "1",
    videoCategoryId: "10", // Music
  });

  const musicResponse = await fetch(
    `${YOUTUBE_API_URL}/search?${musicParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (musicResponse.ok) {
    const musicData = await musicResponse.json();
    const item = musicData.items?.[0];
    if (item) {
      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails?.default?.url,
      };
    }
  }

  // --- Attempt 2: unrestricted search ---
  const generalParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "1",
  });

  const generalResponse = await fetch(
    `${YOUTUBE_API_URL}/search?${generalParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!generalResponse.ok) return null;

  const generalData = await generalResponse.json();
  const item = generalData.items?.[0];
  if (!item) return null;

  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl: item.snippet.thumbnails?.default?.url,
  };
}

// ---------------------------------------------------------------------------
// Playlist item management
// ---------------------------------------------------------------------------

export async function addVideoToPlaylist(
  accessToken: string,
  playlistId: string,
  videoId: string
): Promise<boolean> {
  const response = await fetch(
    `${YOUTUBE_API_URL}/playlistItems?part=snippet`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    // If the video is already in the playlist that is fine — treat as success
    if (errorText.includes("VIDEO_ALREADY_IN_PLAYLIST")) return true;
    console.error("Failed to add video to playlist:", errorText);
    return false;
  }

  return true;
}

/**
 * Fetch all video IDs currently in a YouTube playlist.
 * Used to detect duplicates before adding new videos.
 */
export async function getPlaylistVideoIds(
  accessToken: string,
  playlistId: string
): Promise<Set<string>> {
  const videoIds = new Set<string>();
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await fetch(
      `${YOUTUBE_API_URL}/playlistItems?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) break;

    const data = await response.json();

    for (const item of data.items ?? []) {
      const vid = item.contentDetails?.videoId;
      if (vid) videoIds.add(vid);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return videoIds;
}

/**
 * Fetch all videos in a YouTube playlist with full snippet metadata.
 * Unlike getPlaylistVideoIds() which returns only IDs, this returns
 * title and channelTitle needed for reverse-searching on Spotify.
 */
export async function getPlaylistItems(
  accessToken: string,
  playlistId: string
): Promise<Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl?: string }>> {
  const items: Array<{ videoId: string; title: string; channelTitle: string; thumbnailUrl?: string }> = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await fetch(
      `${YOUTUBE_API_URL}/playlistItems?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) break;

    const data = await response.json();

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
      if (!videoId) continue;
      items.push({
        videoId,
        title: item.snippet?.title ?? "",
        channelTitle: item.snippet?.videoOwnerChannelTitle ?? item.snippet?.channelTitle ?? "",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

// ---------------------------------------------------------------------------
// Quota / error helpers
// ---------------------------------------------------------------------------

export function isQuotaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const msg = String((error as Record<string, unknown>).message ?? "");
  return msg.includes("quotaExceeded") || msg.includes("403");
}
