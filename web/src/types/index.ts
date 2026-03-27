export type SyncDirection = "spotify_to_youtube" | "youtube_to_spotify";

export interface SessionData {
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyUserId?: string;
  spotifyDisplayName?: string;
  spotifyAvatarUrl?: string;

  youtubeAccessToken?: string;
  youtubeRefreshToken?: string;
  youtubeChannelId?: string;
  youtubeDisplayName?: string;
  youtubeAvatarUrl?: string;

  syncConfig?: SyncConfig;
  totalSynced?: number;
  lastSyncTime?: string;
}

export interface SyncConfig {
  direction?: SyncDirection;         // defaults to "spotify_to_youtube"
  spotifyPlaylist: string;           // "Liked Songs" or playlist name
  spotifyPlaylistId?: string;        // resolved playlist ID (empty for Liked Songs)
  isLikedSongs: boolean;
  youtubePlaylist: string;           // YouTube playlist name
  youtubePlaylistId?: string;        // resolved or created playlist ID
  intervalSeconds: number;
}

export interface SpotifyTrack {
  uri: string;
  name: string;
  artist: string;
  albumArt?: string;
  addedAt?: string;
}

export interface YouTubeTrack {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  trackCount: number;
  imageUrl?: string;
  isPublic: boolean;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  videoCount: number;
  thumbnailUrl?: string;
}

export interface SyncHistoryEntry {
  timestamp: string;
  added: number;
  failed: number;
  direction?: SyncDirection;
  tracks: Array<{
    sourceId: string;              // spotifyUri (sp2yt) or youtubeVideoId (yt2sp)
    trackName: string;
    artistName: string;
    youtubeVideoId?: string;       // kept for backward compat (sp2yt result)
    spotifyUri?: string;           // kept for backward compat + yt2sp result
    youtubeTitle?: string;
    status: "added" | "failed" | "not_found";
  }>;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime?: string;
  totalSynced: number;
  lastAdded: number;
  lastFailed: number;
  nextSyncTime?: string;
  spotifyPlaylist: string;
  youtubePlaylist: string;
  direction?: SyncDirection;
}

export interface AuthStatus {
  spotify: {
    connected: boolean;
    displayName?: string;
    avatarUrl?: string;
    userId?: string;
  };
  youtube: {
    connected: boolean;
    displayName?: string;
    avatarUrl?: string;
    channelId?: string;
  };
  syncConfig?: SyncConfig;
  totalSynced: number;
  lastSyncTime?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: number;
}

export type SyncChunkResult = {
  added: Array<SpotifyTrack | YouTubeTrack>;
  failed: Array<SpotifyTrack | YouTubeTrack>;
  notFound: Array<SpotifyTrack | YouTubeTrack>;
  done: boolean;
  progress: number;   // 0-100
  total: number;
  processed: number;
};
