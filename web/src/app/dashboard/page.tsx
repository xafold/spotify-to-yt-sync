"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Music2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight,
  Settings,
  LogOut,
  Play,
  Pause,
  BarChart3,
  List,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Loader2,
  TrendingUp,
  Calendar,
  Hash,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Brand Icons                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function SpotifyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function YouTubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

type SyncDirection = "spotify_to_youtube" | "youtube_to_spotify";

interface SyncConfig {
  direction?: SyncDirection;
  spotifyPlaylist: string;
  youtubePlaylist: string;
  intervalSeconds: number;
  isLikedSongs: boolean;
  youtubePlaylistId?: string;
}

interface SyncStats {
  totalSynced: number;
  lastSyncTime: string | null;
  lastAdded: number;
  lastFailed: number;
}

interface HistoryEntry {
  timestamp: string;
  added: number;
  failed: number;
  direction?: SyncDirection;
  tracks: Array<{
    sourceId?: string;
    spotifyUri?: string;
    trackName: string;
    artistName: string;
    youtubeVideoId?: string;
    youtubeTitle?: string;
    status: "added" | "failed" | "not_found";
  }>;
}

interface StatusData {
  configured: boolean;
  spotifyConnected: boolean;
  youtubeConnected: boolean;
  syncConfig: SyncConfig | null;
  direction?: SyncDirection;
  stats: SyncStats;
  nextSyncTime: string | null;
  history: HistoryEntry[];
  kvAvailable: boolean;
  latestSync: HistoryEntry | null;
}

interface AuthStatus {
  spotify: { connected: boolean; displayName?: string; avatarUrl?: string };
  youtube: { connected: boolean; displayName?: string; avatarUrl?: string };
}

type SyncPhase = "idle" | "running" | "done" | "error" | "quota";

interface SyncProgress {
  phase: SyncPhase;
  progress: number;
  total: number;
  processed: number;
  addedCount: number;
  failedCount: number;
  notFoundCount: number;
  message: string;
  addedTracks: Array<{ name: string; artist: string }>;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Utilities                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "Just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatNextSync(isoString: string | null): string {
  if (!isoString) return "—";
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return "Due now";
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `in ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `in ${hours}h`;
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Navbar                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function DashboardNav({ auth }: { auth: AuthStatus | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="container-app">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{ background: "rgba(29,185,84,0.15)" }}
            >
              <Music2 size={14} className="text-[var(--spotify)]" />
            </div>
            <span className="text-sm font-bold text-white">SyncTube</span>
          </Link>

          {/* Center — connection badges */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className="badge text-[11px]"
              style={{
                background: auth?.spotify.connected
                  ? "rgba(29,185,84,0.12)"
                  : "rgba(255,255,255,0.04)",
                color: auth?.spotify.connected
                  ? "var(--spotify-light)"
                  : "var(--text-muted)",
                border: `1px solid ${auth?.spotify.connected ? "rgba(29,185,84,0.25)" : "var(--border)"}`,
              }}
            >
              <span
                className="status-dot"
                style={{
                  background: auth?.spotify.connected
                    ? "var(--spotify)"
                    : "var(--text-muted)",
                  boxShadow: auth?.spotify.connected
                    ? "0 0 6px var(--spotify)"
                    : "none",
                  width: 6,
                  height: 6,
                }}
              />
              Spotify
            </span>
            <span
              className="badge text-[11px]"
              style={{
                background: auth?.youtube.connected
                  ? "rgba(255,0,0,0.1)"
                  : "rgba(255,255,255,0.04)",
                color: auth?.youtube.connected
                  ? "#ff8080"
                  : "var(--text-muted)",
                border: `1px solid ${auth?.youtube.connected ? "rgba(255,0,0,0.25)" : "var(--border)"}`,
              }}
            >
              <span
                className="status-dot"
                style={{
                  background: auth?.youtube.connected
                    ? "var(--youtube)"
                    : "var(--text-muted)",
                  boxShadow: auth?.youtube.connected
                    ? "0 0 6px var(--youtube)"
                    : "none",
                  width: 6,
                  height: 6,
                }}
              />
              YouTube
            </span>
          </div>

          {/* Right — user menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="btn btn-ghost btn-sm flex items-center gap-2"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: "rgba(29,185,84,0.2)",
                  color: "var(--spotify)",
                }}
              >
                {auth?.spotify.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <span className="hidden sm:inline text-xs max-w-[120px] truncate">
                {auth?.spotify.displayName ?? "Account"}
              </span>
              <ChevronDown size={12} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-[calc(100%+6px)] w-48 rounded-xl py-1 z-50 animate-fade-in-down"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                }}
              >
                <Link
                  href="/setup"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-overlay)] transition-colors no-underline"
                >
                  <Settings size={14} />
                  Setup / Reconfigure
                </Link>
                <div className="my-1 h-px bg-[var(--border)]" />
                <a
                  href="/api/auth/logout"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[rgba(239,68,68,0.08)] transition-colors no-underline"
                >
                  <LogOut size={14} />
                  Disconnect & Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Connection Status Cards                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function ConnectionCards({ auth }: { auth: AuthStatus | null }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Spotify */}
      <div
        className="card card-spotify p-4"
        style={{
          borderColor: auth?.spotify.connected
            ? "rgba(29,185,84,0.25)"
            : "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <SpotifyIcon className="w-5 h-5 text-[var(--spotify)]" />
          <span
            className="badge text-[10px]"
            style={
              auth?.spotify.connected
                ? {
                    background: "rgba(29,185,84,0.15)",
                    color: "var(--spotify-light)",
                    border: "1px solid rgba(29,185,84,0.3)",
                  }
                : {
                    background: "var(--surface-overlay)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {auth?.spotify.connected ? (
              <>
                <span
                  className="status-dot"
                  style={{
                    background: "var(--spotify)",
                    boxShadow: "0 0 6px var(--spotify)",
                    width: 5,
                    height: 5,
                  }}
                />
                Connected
              </>
            ) : (
              "Disconnected"
            )}
          </span>
        </div>
        <p className="text-sm font-bold text-white leading-tight mb-0.5">
          Spotify
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {auth?.spotify.displayName ?? "Not connected"}
        </p>
      </div>

      {/* YouTube */}
      <div
        className="card card-youtube p-4"
        style={{
          borderColor: auth?.youtube.connected
            ? "rgba(255,0,0,0.2)"
            : "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <YouTubeIcon className="w-5 h-5 text-[var(--youtube)]" />
          <span
            className="badge text-[10px]"
            style={
              auth?.youtube.connected
                ? {
                    background: "rgba(255,0,0,0.12)",
                    color: "#ff8080",
                    border: "1px solid rgba(255,0,0,0.25)",
                  }
                : {
                    background: "var(--surface-overlay)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {auth?.youtube.connected ? (
              <>
                <span
                  className="status-dot"
                  style={{
                    background: "var(--youtube)",
                    boxShadow: "0 0 6px var(--youtube)",
                    width: 5,
                    height: 5,
                  }}
                />
                Connected
              </>
            ) : (
              "Disconnected"
            )}
          </span>
        </div>
        <p className="text-sm font-bold text-white leading-tight mb-0.5">
          YouTube
        </p>
        <p className="text-xs text-[var(--text-muted)] truncate">
          {auth?.youtube.displayName ?? "Not connected"}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Stats Row                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function StatsRow({
  stats,
  nextSyncTime,
}: {
  stats: SyncStats;
  nextSyncTime: string | null;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  void now; // used via formatRelativeTime re-render

  const items = [
    {
      icon: <Hash size={16} />,
      color: "var(--spotify)",
      bg: "rgba(29,185,84,0.1)",
      value: stats.totalSynced.toLocaleString(),
      label: "Total synced",
    },
    {
      icon: <TrendingUp size={16} />,
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.1)",
      value:
        stats.lastAdded > 0
          ? `+${stats.lastAdded}`
          : stats.lastAdded.toString(),
      label: "Last batch added",
    },
    {
      icon: <Calendar size={16} />,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.1)",
      value: formatRelativeTime(stats.lastSyncTime),
      label: "Last synced",
    },
    {
      icon: <Clock size={16} />,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.1)",
      value: formatNextSync(nextSyncTime),
      label: "Next auto-sync",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <div key={i} className="card p-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{ background: item.bg, color: item.color }}
          >
            {item.icon}
          </div>
          <p
            className="text-2xl font-black tracking-tight mb-0.5"
            style={{ color: item.color }}
          >
            {item.value}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Sync Control Card                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

function SyncCard({
  status,
  syncProgress,
  onSync,
  onStop,
}: {
  status: StatusData | null;
  syncProgress: SyncProgress;
  onSync: () => void;
  onStop: () => void;
}) {
  const config = status?.syncConfig;
  const isRunning = syncProgress.phase === "running";
  const isDone = syncProgress.phase === "done";
  const isError = syncProgress.phase === "error";
  const isQuota = syncProgress.phase === "quota";

  return (
    <div
      className="card"
      style={{
        borderColor: isRunning
          ? "rgba(29,185,84,0.3)"
          : isDone
            ? "rgba(29,185,84,0.2)"
            : "var(--border)",
        boxShadow: isRunning ? "0 0 24px rgba(29,185,84,0.08)" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isRunning
                ? "rgba(29,185,84,0.15)"
                : "rgba(255,255,255,0.04)",
              border: isRunning
                ? "1px solid rgba(29,185,84,0.3)"
                : "1px solid var(--border)",
            }}
          >
            {isRunning ? (
              <RefreshCw
                size={18}
                className="text-[var(--spotify)] animate-spin"
                style={{ animationDuration: "1.5s" }}
              />
            ) : (
              <Zap size={18} className="text-[var(--text-muted)]" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">
              {isRunning
                ? "Syncing…"
                : isDone
                  ? "Sync complete"
                  : isQuota
                    ? "Quota exceeded"
                    : isError
                      ? "Sync failed"
                      : "Sync Control"}
            </h3>
            {config && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {config.direction === "youtube_to_spotify" ? config.youtubePlaylist : config.spotifyPlaylist}
                </span>
                <ArrowRight size={9} className="text-[var(--text-muted)]" />
                <span className="text-[11px] text-[var(--text-muted)]">
                  {config.direction === "youtube_to_spotify" ? config.spotifyPlaylist : config.youtubePlaylist}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="btn btn-ghost btn-sm flex items-center gap-1.5 text-red-400 border-red-400/20 hover:bg-red-400/10"
          >
            <Pause size={13} />
            Stop
          </button>
        ) : (
          <button
            onClick={onSync}
            disabled={!status?.configured}
            className="btn btn-spotify btn-sm flex items-center gap-1.5"
          >
            <Play size={13} />
            Sync Now
          </button>
        )}
      </div>

      {/* Progress area */}
      {isRunning && (
        <div className="mb-5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-secondary)]">
              {syncProgress.message}
            </span>
            <span className="text-xs font-bold text-[var(--spotify)]">
              {syncProgress.progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${syncProgress.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[var(--text-muted)]">
              {syncProgress.processed} / {syncProgress.total} tracks
            </span>
            <div className="flex items-center gap-3">
              {syncProgress.addedCount > 0 && (
                <span className="text-[11px] text-[var(--spotify)]">
                  +{syncProgress.addedCount} added
                </span>
              )}
              {syncProgress.failedCount > 0 && (
                <span className="text-[11px] text-red-400">
                  {syncProgress.failedCount} failed
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success result */}
      {isDone && syncProgress.addedCount === 0 && !isRunning && (
        <div className="alert alert-success text-xs mb-0 mt-0">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>
            Everything is already in sync —{" "}
            <strong>
              {syncProgress.notFoundCount > 0
                ? `${syncProgress.notFoundCount} tracks not found on YouTube.`
                : "no new songs to add."}
            </strong>
          </span>
        </div>
      )}

      {isDone && syncProgress.addedCount > 0 && !isRunning && (
        <div className="alert alert-success text-xs mb-0 mt-0">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>
            Successfully added{" "}
            <strong>
              {syncProgress.addedCount} song
              {syncProgress.addedCount !== 1 ? "s" : ""}
            </strong>{" "}
            to your {status?.syncConfig?.direction === "youtube_to_spotify" ? "Spotify" : "YouTube"} playlist.
            {syncProgress.failedCount > 0 && (
              <> {syncProgress.failedCount} could not be added.</>
            )}
          </span>
        </div>
      )}

      {isError && (
        <div className="alert alert-error text-xs mb-0 mt-0">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{syncProgress.message}</span>
        </div>
      )}

      {isQuota && (
        <div className="alert alert-warning text-xs mb-0 mt-0">
          <AlertCircle size={14} className="flex-shrink-0" />
          <div>
            <strong className="block mb-0.5">YouTube API quota exceeded</strong>
            <span className="opacity-80">
              Your progress has been saved. The daily quota resets at midnight
              Pacific Time. Run sync again tomorrow to continue.
            </span>
          </div>
        </div>
      )}

      {/* Live added tracks feed */}
      {isRunning && syncProgress.addedTracks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Just added
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
            {syncProgress.addedTracks
              .slice()
              .reverse()
              .slice(0, 8)
              .map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 animate-fade-in"
                >
                  <CheckCircle2
                    size={12}
                    className="text-[var(--spotify)] flex-shrink-0"
                  />
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    <span className="text-white font-medium">{t.name}</span>
                    <span className="text-[var(--text-muted)]">
                      {" "}
                      — {t.artist}
                    </span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Not configured warning */}
      {!status?.configured && (
        <div
          className="mt-4 flex items-start gap-2 p-3 rounded-lg"
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.15)",
          }}
        >
          <Info size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-yellow-300 font-medium mb-0.5">
              Setup not complete
            </p>
            <p className="text-[var(--text-muted)]">
              Please{" "}
              <Link
                href="/setup"
                className="text-yellow-400 hover:text-yellow-300"
              >
                complete the setup wizard
              </Link>{" "}
              before syncing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Sync Config Summary                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function ConfigSummary({ config }: { config: SyncConfig | null }) {
  if (!config) return null;

  const intervalLabel =
    config.intervalSeconds < 60
      ? `${config.intervalSeconds}s`
      : config.intervalSeconds < 3600
        ? `${config.intervalSeconds / 60}m`
        : config.intervalSeconds < 86400
          ? `${config.intervalSeconds / 3600}h`
          : "24h";

  return (
    <div className="card p-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Sync Route
        </p>
        <Link
          href="/setup"
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1 transition-colors no-underline"
        >
          <Settings size={10} />
          Change
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {config.direction === "youtube_to_spotify" ? (
          <>
            <span className="badge badge-youtube text-[11px]">
              <YouTubeIcon className="w-3 h-3" />
              {config.youtubePlaylist}
            </span>
            <ArrowRight size={12} className="text-[var(--text-muted)]" />
            <span className="badge badge-spotify text-[11px]">
              <SpotifyIcon className="w-3 h-3" />
              {config.spotifyPlaylist}
            </span>
          </>
        ) : (
          <>
            <span className="badge badge-spotify text-[11px]">
              <SpotifyIcon className="w-3 h-3" />
              {config.spotifyPlaylist}
            </span>
            <ArrowRight size={12} className="text-[var(--text-muted)]" />
            <span className="badge badge-youtube text-[11px]">
              <YouTubeIcon className="w-3 h-3" />
              {config.youtubePlaylist}
            </span>
          </>
        )}
        <span className="ml-auto badge badge-neutral text-[10px] flex items-center gap-1">
          <Clock size={10} />
          every {intervalLabel}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  History Table                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function HistoryTable({ history }: { history: HistoryEntry[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (history.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <List size={15} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-bold text-white">Sync History</h3>
        </div>
        <div className="py-10 text-center">
          <BarChart3
            size={28}
            className="text-[var(--text-muted)] mx-auto mb-3"
          />
          <p className="text-sm text-[var(--text-muted)]">
            No sync history yet.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Run your first sync to see activity here.
          </p>
        </div>
      </div>
    );
  }

  const visible = showAll ? history : history.slice(0, 5);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List size={15} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-bold text-white">Sync History</h3>
          <span className="badge badge-neutral text-[10px]">
            {history.length}
          </span>
        </div>
        {history.length > 5 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1"
          >
            {showAll ? (
              <>
                Show less <ChevronUp size={11} />
              </>
            ) : (
              <>
                Show all <ChevronDown size={11} />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visible.map((entry, i) => {
          const isOpen = expanded === i;
          const hasAdded = entry.added > 0;
          const hasFailed = entry.failed > 0;

          return (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-all duration-200"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Row header */}
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                {/* Status icon */}
                {entry.added > 0 ? (
                  <CheckCircle2
                    size={14}
                    className="text-[var(--spotify)] flex-shrink-0"
                  />
                ) : hasFailed ? (
                  <AlertCircle
                    size={14}
                    className="text-yellow-400 flex-shrink-0"
                  />
                ) : (
                  <CheckCircle2
                    size={14}
                    className="text-[var(--text-muted)] flex-shrink-0"
                  />
                )}

                {/* Date */}
                <span className="text-xs text-[var(--text-secondary)] flex-shrink-0 w-32">
                  {formatDateTime(entry.timestamp)}
                </span>

                {/* Added badge */}
                <span
                  className={`badge text-[10px] ${hasAdded ? "badge-success" : "badge-neutral"}`}
                >
                  +{entry.added} added
                </span>

                {/* Failed badge (only if > 0) */}
                {hasFailed && (
                  <span className="badge badge-warning text-[10px]">
                    {entry.failed} failed
                  </span>
                )}

                {/* Spacer */}
                <span className="flex-1" />

                {/* Expand arrow */}
                {entry.tracks.length > 0 && (
                  <span className="text-[var(--text-muted)]">
                    {isOpen ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </span>
                )}
              </button>

              {/* Expanded track list */}
              {isOpen && entry.tracks.length > 0 && (
                <div className="border-t border-[var(--border)] divide-y divide-[rgba(42,42,42,0.5)] animate-fade-in">
                  {entry.tracks.slice(0, 20).map((track, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      {track.status === "added" ? (
                        <CheckCircle2
                          size={12}
                          className="text-[var(--spotify)] flex-shrink-0"
                        />
                      ) : track.status === "not_found" ? (
                        <XCircle
                          size={12}
                          className="text-[var(--text-muted)] flex-shrink-0"
                        />
                      ) : (
                        <AlertCircle
                          size={12}
                          className="text-yellow-400 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {track.trackName}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {track.artistName}
                        </p>
                      </div>
                      {entry.direction === "youtube_to_spotify" && track.spotifyUri ? (
                        <a
                          href={`https://open.spotify.com/track/${track.spotifyUri.split(":").pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--spotify)] transition-colors"
                          title="Open on Spotify"
                        >
                          <ExternalLink size={11} />
                        </a>
                      ) : track.youtubeVideoId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${track.youtubeVideoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[#ff8080] transition-colors"
                          title="Watch on YouTube"
                        >
                          <ExternalLink size={11} />
                        </a>
                      ) : null}
                      <span
                        className={`badge text-[9px] flex-shrink-0 ${
                          track.status === "added"
                            ? "badge-success"
                            : track.status === "not_found"
                              ? "badge-neutral"
                              : "badge-warning"
                        }`}
                      >
                        {track.status === "added"
                          ? "Added"
                          : track.status === "not_found"
                            ? "Not found"
                            : "Failed"}
                      </span>
                    </div>
                  ))}
                  {entry.tracks.length > 20 && (
                    <p className="text-[11px] text-[var(--text-muted)] px-4 py-2">
                      … and {entry.tracks.length - 20} more tracks
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  KV Warning Banner                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

function KvWarning() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="alert alert-warning text-xs relative">
      <Info size={14} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold mb-0.5">Vercel KV not configured</p>
        <p className="opacity-80">
          Sync state is stored in memory only and will be lost on redeploy. To
          persist your sync history and prevent duplicates across deployments,{" "}
          <a
            href="https://vercel.com/storage/kv"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-yellow-300"
          >
            enable Vercel KV
          </a>{" "}
          in your project's Storage tab.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-yellow-400/60 hover:text-yellow-400 transition-colors p-0.5"
        aria-label="Dismiss"
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Dashboard Page                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const DEFAULT_PROGRESS: SyncProgress = {
  phase: "idle",
  progress: 0,
  total: 0,
  processed: 0,
  addedCount: 0,
  failedCount: 0,
  notFoundCount: 0,
  message: "Ready to sync",
  addedTracks: [],
};

export default function DashboardPage() {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncProgress, setSyncProgress] =
    useState<SyncProgress>(DEFAULT_PROGRESS);
  const stopRequested = useRef(false);

  /* ── Fetch status ── */
  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, authRes] = await Promise.all([
        fetch("/api/sync/status"),
        fetch("/api/auth/status"),
      ]);

      if (statusRes.ok) {
        const data: StatusData = await statusRes.json();
        setStatusData(data);
      }
      if (authRes.ok) {
        const data: AuthStatus = await authRes.json();
        setAuthStatus(data);
      }
    } catch {
      // silently fail — UI degrades gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds for stats updates
    const id = setInterval(fetchStatus, 30_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  /* ── Run sync (chunked) ── */
  const handleSync = useCallback(async () => {
    stopRequested.current = false;
    setSyncProgress({
      ...DEFAULT_PROGRESS,
      phase: "running",
      message: statusData?.syncConfig?.direction === "youtube_to_spotify"
        ? "Fetching YouTube playlist items…"
        : "Fetching Spotify tracks…",
    });

    let offset = 0;
    const chunkSize = 15;
    let totalAdded = 0;
    let totalFailed = 0;
    let totalNotFound = 0;
    const allAddedTracks: Array<{ name: string; artist: string }> = [];

    try {
      while (true) {
        if (stopRequested.current) {
          setSyncProgress((prev) => ({
            ...prev,
            phase: "idle",
            message: "Sync stopped by user.",
          }));
          break;
        }

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset, chunkSize }),
        });

        if (res.status === 429) {
          // Quota exceeded
          setSyncProgress((prev) => ({
            ...prev,
            phase: "quota",
            message:
              "YouTube API quota exceeded. Progress saved — try again tomorrow.",
          }));
          await fetchStatus();
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setSyncProgress((prev) => ({
            ...prev,
            phase: "error",
            message:
              (errData as { error?: string }).error ??
              "An unexpected error occurred.",
          }));
          return;
        }

        const chunk = await res.json();

        totalAdded += chunk.added?.length ?? 0;
        totalFailed += chunk.failed?.length ?? 0;
        totalNotFound += chunk.notFound?.length ?? 0;

        for (const t of chunk.added ?? []) {
          allAddedTracks.push({ name: t.name, artist: t.artist });
        }

        setSyncProgress({
          phase: chunk.done ? "done" : "running",
          progress: chunk.progress ?? 0,
          total: chunk.total ?? 0,
          processed: chunk.processed ?? 0,
          addedCount: totalAdded,
          failedCount: totalFailed,
          notFoundCount: totalNotFound,
          message: chunk.done
            ? "Sync complete!"
            : `Processing tracks ${chunk.processed ?? 0} / ${chunk.total ?? "…"}`,
          addedTracks: allAddedTracks,
        });

        if (chunk.done) {
          await fetchStatus();
          break;
        }

        offset += chunkSize;

        // Small pause between chunks so the UI can breathe
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err) {
      setSyncProgress((prev) => ({
        ...prev,
        phase: "error",
        message: `Network error: ${String(err)}`,
      }));
    }
  }, [fetchStatus]);

  const handleStop = () => {
    stopRequested.current = true;
  };

  /* ── Not configured redirect hint ── */
  const notConfigured =
    !loading &&
    (!authStatus?.spotify.connected || !authStatus?.youtube.connected);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-sm text-[var(--text-muted)]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <DashboardNav auth={authStatus} />

      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.025]"
          style={{
            background: "radial-gradient(ellipse, #1DB954 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <main className="container-app max-w-4xl py-8 relative z-10">
        {/* Page title */}
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Monitor and control your{" "}
            {statusData?.syncConfig?.direction === "youtube_to_spotify"
              ? "YouTube → Spotify"
              : "Spotify → YouTube"}{" "}
            sync
          </p>
        </div>

        {/* Not configured warning */}
        {notConfigured && (
          <div className="alert alert-warning mb-6 animate-fade-in">
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>
              <p className="font-semibold">Setup not complete</p>
              <p className="text-sm opacity-80 mt-0.5">
                Connect your accounts and configure playlists before syncing.{" "}
                <Link href="/setup" className="underline">
                  Open Setup Wizard →
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* KV warning */}
        {statusData && !statusData.kvAvailable && (
          <div className="mb-6 animate-fade-in">
            <KvWarning />
          </div>
        )}

        <div className="space-y-5">
          {/* Row 1: Connection cards */}
          <div className="animate-fade-in-up">
            <ConnectionCards auth={authStatus} />
          </div>

          {/* Row 2: Stats */}
          {statusData?.stats && (
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              <StatsRow
                stats={statusData.stats}
                nextSyncTime={statusData.nextSyncTime}
              />
            </div>
          )}

          {/* Row 3: Sync route + Sync card side by side on large screens */}
          <div
            className="grid grid-cols-1 lg:grid-cols-5 gap-5 animate-fade-in-up"
            style={{ animationDelay: "160ms" }}
          >
            {/* Config summary — 2/5 */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <ConfigSummary config={statusData?.syncConfig ?? null} />

              {/* Quick links */}
              <div
                className="card p-4"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Quick links
                </p>
                <div className="space-y-2">
                  {statusData?.syncConfig?.youtubePlaylistId && (
                    <a
                      href={`https://www.youtube.com/playlist?list=${statusData.syncConfig.youtubePlaylistId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white transition-colors no-underline group"
                    >
                      <YouTubeIcon className="w-3.5 h-3.5 text-[var(--youtube)] flex-shrink-0" />
                      View YouTube Playlist
                      <ExternalLink
                        size={10}
                        className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                      />
                    </a>
                  )}
                  <a
                    href="https://developer.spotify.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white transition-colors no-underline group"
                  >
                    <SpotifyIcon className="w-3.5 h-3.5 text-[var(--spotify)] flex-shrink-0" />
                    Spotify Developer Dashboard
                    <ExternalLink
                      size={10}
                      className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    />
                  </a>
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white transition-colors no-underline group"
                  >
                    <YouTubeIcon className="w-3.5 h-3.5 text-[#ff8080] flex-shrink-0" />
                    Google Cloud Console
                    <ExternalLink
                      size={10}
                      className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    />
                  </a>
                  <Link
                    href="/setup"
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-white transition-colors no-underline group"
                  >
                    <Settings
                      size={14}
                      className="text-[var(--text-muted)] flex-shrink-0"
                    />
                    Reconfigure sync
                    <ArrowRight
                      size={10}
                      className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sync card — 3/5 */}
            <div className="lg:col-span-3">
              <SyncCard
                status={statusData}
                syncProgress={syncProgress}
                onSync={handleSync}
                onStop={handleStop}
              />
            </div>
          </div>

          {/* Row 4: History */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "240ms" }}
          >
            <HistoryTable history={statusData?.history ?? []} />
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-16" />
      </main>
    </div>
  );
}
