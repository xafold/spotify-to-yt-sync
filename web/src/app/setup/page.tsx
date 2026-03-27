"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Music2,
  Youtube,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Loader2,
  ListMusic,
  Clock,
  Info,
  Lock,
  Globe,
  Zap,
  User,
  Check,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import type { SyncDirection } from "@/types";

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

interface AuthStatus {
  spotify: { connected: boolean; displayName?: string; avatarUrl?: string };
  youtube: { connected: boolean; displayName?: string; avatarUrl?: string };
  syncConfig?: {
    direction?: SyncDirection;
    spotifyPlaylist: string;
    youtubePlaylist: string;
    intervalSeconds: number;
    isLikedSongs: boolean;
    youtubePlaylistId?: string;
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  trackCount: number;
  imageUrl?: string;
}

interface YouTubePlaylist {
  id: string;
  title: string;
  videoCount: number;
  thumbnailUrl?: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Step Progress Indicator                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  { label: "API Keys" },
  { label: "Spotify" },
  { label: "YouTube" },
  { label: "Playlists" },
  { label: "Launch" },
];

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="step-circle transition-all duration-300"
                style={{
                  background: done
                    ? "rgba(29,185,84,0.15)"
                    : active
                    ? "var(--spotify)"
                    : "var(--surface-overlay)",
                  color: done
                    ? "var(--spotify)"
                    : active
                    ? "#000"
                    : "var(--text-muted)",
                  border: done
                    ? "1px solid rgba(29,185,84,0.35)"
                    : active
                    ? "none"
                    : "1px solid var(--border)",
                  boxShadow: active
                    ? "0 0 16px rgba(29,185,84,0.5)"
                    : "none",
                }}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className="text-[11px] font-medium hidden sm:block transition-colors duration-200"
                style={{
                  color: active
                    ? "var(--spotify-light)"
                    : done
                    ? "var(--text-secondary)"
                    : "var(--text-muted)",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className="step-connector mx-2 sm:mx-3 mb-4"
                style={{
                  background: i < current ? "var(--spotify)" : "var(--border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Instruction Step                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function InstructionStep({
  num,
  children,
}: {
  num: number;
  children: React.ReactNode;
}) {
  return (
    <div className="instruction-step">
      <span className="instruction-step-number">{num}</span>
      <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {children}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Connected User Pill                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function ConnectedPill({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <CheckCircle2 size={14} />
      Connected as {name}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Step 0 — Enter API Keys                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function CredentialField({
  label,
  id,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--spotify)] focus:ring-1 focus:ring-[var(--spotify)] pr-10 font-mono"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function StepCredentials({ onNext }: { onNext: () => void }) {
  const [spotifyClientId, setSpotifyClientId] = useState("");
  const [spotifyClientSecret, setSpotifyClientSecret] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/auth/credentials")
      .then((r) => r.json())
      .then((d) => {
        if (d.configured) {
          setAlreadySaved(true);
          setSavedAt(d.savedAt);
        } else {
          setShowForm(true);
        }
      })
      .catch(() => setShowForm(true));
  }, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyClientId, spotifyClientSecret, googleClientId, googleClientSecret }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save credentials.");
      } else {
        onNext();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(29,185,84,0.1)", border: "1px solid rgba(29,185,84,0.2)" }}
        >
          <KeyRound size={26} className="text-[var(--spotify)]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Enter Your API Keys</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Paste your Spotify and Google OAuth credentials below. These are stored securely on your server and never shared.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {alreadySaved && !showForm ? (
        <div className="card mb-6" style={{ borderColor: "var(--spotify)" }}>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 size={18} className="text-[var(--spotify)]" />
            <p className="font-semibold text-white text-sm">API keys already saved</p>
          </div>
          {savedAt && (
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Last updated: {new Date(savedAt).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Your Spotify and Google credentials are configured. You can continue to connect your accounts, or update the keys below.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors inline-flex items-center gap-1"
          >
            <RefreshCw size={11} />
            Update credentials
          </button>
        </div>
      ) : showForm ? (
        <>
          {/* How to get keys */}
          <div className="instruction-box mb-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
              Where to find your keys
            </p>
            <InstructionStep num={1}>
              <strong className="text-white">Spotify:</strong> Go to{" "}
              <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium">
                developer.spotify.com/dashboard <ExternalLink size={11} />
              </a>
              , create an app, then copy <strong className="text-white">Client ID</strong> and <strong className="text-white">Client Secret</strong>.
              In Settings → Redirect URIs, add:{" "}
              <code className="text-[11px] break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/auth/spotify/callback
              </code>
            </InstructionStep>
            <InstructionStep num={2}>
              <strong className="text-white">Google:</strong> Go to{" "}
              <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium">
                console.cloud.google.com <ExternalLink size={11} />
              </a>
              , enable the <strong className="text-white">YouTube Data API v3</strong>, create an OAuth 2.0 Client ID (Web application), and add redirect URI:{" "}
              <code className="text-[11px] break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}/api/auth/youtube/callback
              </code>
            </InstructionStep>
          </div>

          {/* Spotify fields */}
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(29,185,84,0.05)", border: "1px solid rgba(29,185,84,0.15)" }}>
            <div className="flex items-center gap-2 mb-4">
              <SpotifyIcon className="w-4 h-4 text-[var(--spotify)]" />
              <span className="text-sm font-bold text-white">Spotify Credentials</span>
            </div>
            <CredentialField label="Client ID" id="sp-client-id" value={spotifyClientId} onChange={setSpotifyClientId} placeholder="32-character hex string" hint="Found in your Spotify app dashboard under Settings" />
            <CredentialField label="Client Secret" id="sp-client-secret" value={spotifyClientSecret} onChange={setSpotifyClientSecret} placeholder="32-character hex string" hint="Keep this secret — treat it like a password" />
          </div>

          {/* Google fields */}
          <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,0,0,0.04)", border: "1px solid rgba(255,0,0,0.15)" }}>
            <div className="flex items-center gap-2 mb-4">
              <YouTubeIcon className="w-4 h-4 text-[var(--youtube)]" />
              <span className="text-sm font-bold text-white">Google / YouTube Credentials</span>
            </div>
            <CredentialField label="Client ID" id="g-client-id" value={googleClientId} onChange={setGoogleClientId} placeholder="Ends in .apps.googleusercontent.com" hint="Found in Google Cloud Console → Credentials" />
            <CredentialField label="Client Secret" id="g-client-secret" value={googleClientSecret} onChange={setGoogleClientSecret} placeholder="GOCSPX-…" hint="Keep this secret — treat it like a password" />
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2.5 mb-6 p-3 rounded-lg" style={{ background: "rgba(29,185,84,0.05)", border: "1px solid rgba(29,185,84,0.12)" }}>
            <Lock size={14} className="text-[var(--spotify)] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-white">Your keys stay private.</strong> They are stored in your Vercel KV database and never sent to third parties. Only this app reads them to perform OAuth on your behalf.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !spotifyClientId || !spotifyClientSecret || !googleClientId || !googleClientSecret}
            className="btn btn-spotify w-full justify-center text-base py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
            {saving ? "Saving…" : "Save & Continue"}
            {!saving && <ArrowRight size={16} />}
          </button>
        </>
      ) : (
        <div className="flex justify-center py-8">
          <div className="spinner spinner-lg" />
        </div>
      )}

      {/* Continue if already saved */}
      {alreadySaved && !showForm && (
        <button
          onClick={onNext}
          className="btn btn-primary-gradient w-full justify-center text-base py-3.5 mt-3"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Step 1 — Connect Spotify                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function StepSpotify({
  authStatus,
  onNext,
  error,
}: {
  authStatus: AuthStatus | null;
  onNext: () => void;
  error: string | null;
}) {
  const connected = authStatus?.spotify.connected;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.25)" }}
        >
          <SpotifyIcon className="w-7 h-7 text-[var(--spotify)]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Connect Spotify</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            We need read-only access to your Spotify playlists and Liked Songs.
            We will never modify your Spotify library.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Connection failed</p>
            <p className="text-sm opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Connected state */}
      {connected ? (
        <div className="card card-spotify mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={20} className="text-[var(--spotify)]" />
            <h3 className="font-bold text-white">Spotify Connected!</h3>
          </div>
          <ConnectedPill
            name={authStatus!.spotify.displayName ?? "your account"}
            color="var(--spotify)"
          />
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Your Spotify account is linked. You can proceed to the next step.
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <a
              href="/api/auth/spotify"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw size={11} />
              Reconnect with a different account
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Instructions */}
          <div className="instruction-box mb-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
              Before you click — set up your Spotify app
            </p>
            <InstructionStep num={1}>
              Go to{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium"
              >
                developer.spotify.com/dashboard
                <ExternalLink size={11} />
              </a>{" "}
              and log in with your Spotify account.
            </InstructionStep>
            <InstructionStep num={2}>
              Click <strong className="text-white">Create App</strong>. Give it any name
              (e.g. &ldquo;My Sync App&rdquo;) and description.
            </InstructionStep>
            <InstructionStep num={3}>
              Inside the app, go to <strong className="text-white">Settings</strong> and add
              this Redirect URI:
              <code className="block mt-1.5 text-[11px] break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}
                /api/auth/spotify/callback
              </code>
            </InstructionStep>
            <InstructionStep num={4}>
              Copy your <strong className="text-white">Client ID</strong> and{" "}
              <strong className="text-white">Client Secret</strong> — you already pasted them in the previous step.
            </InstructionStep>
            <InstructionStep num={5}>
              Click the button below to authorize with Spotify.
            </InstructionStep>
          </div>

          {/* Permission note */}
          <div className="flex items-start gap-2.5 mb-6 p-3 rounded-lg"
            style={{ background: "rgba(29,185,84,0.05)", border: "1px solid rgba(29,185,84,0.12)" }}>
            <Lock size={14} className="text-[var(--spotify)] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-white">Minimal permissions.</strong> We request read
              access to your playlists and Liked Songs, plus write access to create or add
              to playlists (required for YouTube → Spotify sync). We will never delete or
              modify your existing content.
            </p>
          </div>

          {/* Connect button */}
          <a
            href="/api/auth/spotify"
            className="btn btn-spotify w-full justify-center text-base py-3.5"
          >
            <SpotifyIcon className="w-5 h-5" />
            Connect Spotify Account
            <ArrowRight size={16} />
          </a>
        </>
      )}

      {/* Next button */}
      {connected && (
        <button
          onClick={onNext}
          className="btn btn-primary-gradient w-full justify-center text-base py-3.5 mt-2"
        >
          Continue to YouTube
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Step 2 — Connect YouTube                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function StepYouTube({
  authStatus,
  onNext,
  onBack,
  error,
}: {
  authStatus: AuthStatus | null;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
}) {
  const connected = authStatus?.youtube.connected;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.2)" }}
        >
          <YouTubeIcon className="w-7 h-7 text-[var(--youtube)]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Connect YouTube</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            We need access to manage YouTube playlists on your behalf. This
            requires a Google Cloud project with the YouTube Data API enabled.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Connection failed</p>
            <p className="text-sm opacity-80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Connected state */}
      {connected ? (
        <div className="card card-youtube mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={20} className="text-[#ff6666]" />
            <h3 className="font-bold text-white">YouTube Connected!</h3>
          </div>
          <ConnectedPill
            name={authStatus!.youtube.displayName ?? "your channel"}
            color="#ff6666"
          />
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Your YouTube account is linked. You can proceed to choose playlists.
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <a
              href="/api/auth/youtube"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw size={11} />
              Reconnect with a different account
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Instructions */}
          <div className="instruction-box mb-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
              One-time Google Cloud setup (takes ~5 minutes)
            </p>
            <InstructionStep num={1}>
              Go to{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium"
              >
                console.cloud.google.com
                <ExternalLink size={11} />
              </a>{" "}
              and sign in. Click <strong className="text-white">New Project</strong>,
              give it a name (e.g. &ldquo;YouTube Sync&rdquo;), and click Create.
            </InstructionStep>
            <InstructionStep num={2}>
              In the left sidebar, go to{" "}
              <strong className="text-white">APIs &amp; Services → Library</strong>. Search
              for <strong className="text-white">YouTube Data API v3</strong> and click{" "}
              <strong className="text-white">Enable</strong>.
            </InstructionStep>
            <InstructionStep num={3}>
              Go to <strong className="text-white">APIs &amp; Services → OAuth consent screen</strong>.
              Choose <strong className="text-white">External</strong>, fill in your App name
              and email. Under <strong className="text-white">Scopes</strong>, add{" "}
              <code>youtube</code>. Add your Google account as a{" "}
              <strong className="text-white">Test User</strong>.
            </InstructionStep>
            <InstructionStep num={4}>
              Go to <strong className="text-white">APIs &amp; Services → Credentials</strong>.
              Click <strong className="text-white">+ Create Credentials → OAuth 2.0 Client ID</strong>.
              Choose <strong className="text-white">Web application</strong>. Under{" "}
              <strong className="text-white">Authorized redirect URIs</strong>, add:
              <code className="block mt-1.5 text-[11px] break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app"}
                /api/auth/youtube/callback
              </code>
            </InstructionStep>
            <InstructionStep num={5}>
              Copy your <strong className="text-white">Client ID</strong> and{" "}
              <strong className="text-white">Client Secret</strong> — you already pasted them in the first step.
            </InstructionStep>
            <InstructionStep num={6}>
              Click the button below to authorize with Google.
            </InstructionStep>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2.5 mb-6 p-3 rounded-lg"
            style={{ background: "rgba(255,0,0,0.05)", border: "1px solid rgba(255,0,0,0.12)" }}>
            <Info size={14} className="text-[#ff6666] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-white">Test mode notice.</strong> While your app is in
              &ldquo;Testing&rdquo; on Google Cloud, only accounts you add as Test Users can
              authorize. This is fine for personal use — no need to publish your app.
            </p>
          </div>

          {/* Connect button */}
          <a
            href="/api/auth/youtube"
            className="btn btn-youtube w-full justify-center text-base py-3.5"
          >
            <YouTubeIcon className="w-5 h-5" />
            Connect YouTube Account
            <ArrowRight size={16} />
          </a>
        </>
      )}

      {/* Nav */}
      <div className="flex gap-3 mt-3">
        <button onClick={onBack} className="btn btn-ghost flex-1 justify-center">
          <ArrowLeft size={15} />
          Back
        </button>
        {connected && (
          <button
            onClick={onNext}
            className="btn btn-primary-gradient flex-[2] justify-center text-base py-3"
          >
            Choose Playlists
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Step 3 — Choose Playlists                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function StepPlaylists({
  onNext,
  onBack,
}: {
  onNext: (cfg: { spotifyPlaylist: string; youtubePlaylist: string; intervalSeconds: number; direction: SyncDirection }) => void;
  onBack: () => void;
}) {
  const [direction, setDirection] = useState<SyncDirection>("spotify_to_youtube");

  // Spotify → YouTube state
  const [spPlaylists, setSpPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingSpPlaylists, setLoadingSpPlaylists] = useState(true);
  const [selectedSpotify, setSelectedSpotify] = useState("Liked Songs");
  const [ytDestName, setYtDestName] = useState("My YouTube Music");

  // YouTube → Spotify state
  const [ytPlaylists, setYtPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loadingYtPlaylists, setLoadingYtPlaylists] = useState(false);
  const [selectedYouTube, setSelectedYouTube] = useState("");
  const [spDestName, setSpDestName] = useState("My Spotify Music");

  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [intervalSeconds, setIntervalSeconds] = useState(300);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch Spotify playlists on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/playlists/spotify");
        if (!res.ok) throw new Error("Failed to load playlists");
        const data = await res.json();
        setSpPlaylists(data.playlists ?? []);
      } catch {
        setPlaylistError("Could not load your Spotify playlists. Make sure Spotify is connected.");
      } finally {
        setLoadingSpPlaylists(false);
      }
    })();
  }, []);

  // Fetch YouTube playlists when direction switches to youtube_to_spotify
  useEffect(() => {
    if (direction !== "youtube_to_spotify") return;
    if (ytPlaylists.length > 0) return; // already loaded
    setLoadingYtPlaylists(true);
    setPlaylistError(null);
    fetch("/api/playlists/youtube")
      .then((r) => r.json())
      .then((data) => {
        const list: YouTubePlaylist[] = data.playlists ?? [];
        setYtPlaylists(list);
        if (list.length > 0) setSelectedYouTube(list[0].title);
      })
      .catch(() => setPlaylistError("Could not load your YouTube playlists. Make sure YouTube is connected."))
      .finally(() => setLoadingYtPlaylists(false));
  }, [direction, ytPlaylists.length]);

  // Auto-suggest destination name when source changes (sp→yt)
  useEffect(() => {
    if (direction !== "spotify_to_youtube") return;
    setYtDestName(selectedSpotify === "Liked Songs" ? "My YouTube Music" : selectedSpotify);
  }, [selectedSpotify, direction]);

  // Auto-suggest destination name when source changes (yt→sp)
  useEffect(() => {
    if (direction !== "youtube_to_spotify" || !selectedYouTube) return;
    setSpDestName(selectedYouTube || "My Spotify Music");
  }, [selectedYouTube, direction]);

  const isValid =
    direction === "spotify_to_youtube"
      ? Boolean(selectedSpotify && ytDestName.trim())
      : Boolean(selectedYouTube && spDestName.trim());

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setSaveError(null);

    const spotifyPlaylist = direction === "spotify_to_youtube" ? selectedSpotify : spDestName.trim();
    const youtubePlaylist = direction === "spotify_to_youtube" ? ytDestName.trim() : selectedYouTube;

    try {
      const res = await fetch("/api/sync/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyPlaylist, youtubePlaylist, intervalSeconds, direction }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save configuration.");
        return;
      }

      onNext({ spotifyPlaylist, youtubePlaylist, intervalSeconds, direction });
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const intervalOptions = [
    { label: "Every 5 minutes", value: 300 },
    { label: "Every 15 minutes", value: 900 },
    { label: "Every 30 minutes", value: 1800 },
    { label: "Every hour", value: 3600 },
    { label: "Every 6 hours", value: 21600 },
    { label: "Every 24 hours", value: 86400 },
  ];

  const sourceName = direction === "spotify_to_youtube" ? selectedSpotify : selectedYouTube;
  const destName = direction === "spotify_to_youtube" ? ytDestName : spDestName;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}
        >
          <ListMusic className="w-7 h-7" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Choose Playlists</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Choose your sync direction, then pick a source playlist and destination.
          </p>
        </div>
      </div>

      {saveError && (
        <div className="alert alert-error mb-5">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Could not save configuration</p>
            <p className="text-sm opacity-80 mt-0.5">{saveError}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Direction toggle */}
        <div
          className="flex gap-1.5 p-1.5 rounded-xl"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => { setDirection("spotify_to_youtube"); setPlaylistError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              direction === "spotify_to_youtube"
                ? "text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            style={direction === "spotify_to_youtube" ? { background: "var(--surface-overlay)" } : {}}
          >
            <SpotifyIcon className="w-3.5 h-3.5 text-[var(--spotify)]" />
            <ArrowRight size={12} />
            <YouTubeIcon className="w-3.5 h-3.5 text-[var(--youtube)]" />
            <span className="hidden sm:inline ml-1">Spotify → YouTube</span>
          </button>
          <button
            onClick={() => { setDirection("youtube_to_spotify"); setPlaylistError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              direction === "youtube_to_spotify"
                ? "text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            style={direction === "youtube_to_spotify" ? { background: "var(--surface-overlay)" } : {}}
          >
            <YouTubeIcon className="w-3.5 h-3.5 text-[var(--youtube)]" />
            <ArrowRight size={12} />
            <SpotifyIcon className="w-3.5 h-3.5 text-[var(--spotify)]" />
            <span className="hidden sm:inline ml-1">YouTube → Spotify</span>
          </button>
        </div>

        {playlistError && (
          <div className="alert alert-error text-sm">
            <AlertCircle size={14} />
            {playlistError}
          </div>
        )}

        {/* Source */}
        {direction === "spotify_to_youtube" ? (
          <div>
            <label className="label flex items-center gap-1.5">
              <SpotifyIcon className="w-3.5 h-3.5 text-[var(--spotify)]" />
              Spotify Source
            </label>
            {loadingSpPlaylists ? (
              <div className="input flex items-center gap-2 opacity-60 cursor-wait">
                <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">Loading your playlists…</span>
              </div>
            ) : (
              <select
                value={selectedSpotify}
                onChange={(e) => setSelectedSpotify(e.target.value)}
                className="input select"
              >
                {spPlaylists.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}{p.trackCount > 0 ? ` (${p.trackCount} tracks)` : ""}
                  </option>
                ))}
              </select>
            )}
            {selectedSpotify === "Liked Songs" && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
                <Info size={11} />
                All songs you&apos;ve hearted in Spotify will be synced.
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="label flex items-center gap-1.5">
              <YouTubeIcon className="w-3.5 h-3.5 text-[var(--youtube)]" />
              YouTube Source Playlist
            </label>
            {loadingYtPlaylists ? (
              <div className="input flex items-center gap-2 opacity-60 cursor-wait">
                <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">Loading your playlists…</span>
              </div>
            ) : ytPlaylists.length === 0 ? (
              <div className="alert alert-info text-sm">
                <Info size={14} />
                No YouTube playlists found. Create a playlist on YouTube first.
              </div>
            ) : (
              <select
                value={selectedYouTube}
                onChange={(e) => setSelectedYouTube(e.target.value)}
                className="input select"
              >
                {ytPlaylists.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.title}{p.videoCount > 0 ? ` (${p.videoCount} videos)` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Arrow divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
          >
            <ArrowRight size={14} className="text-[var(--text-muted)]" />
          </div>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Destination */}
        {direction === "spotify_to_youtube" ? (
          <div>
            <label className="label flex items-center gap-1.5">
              <YouTubeIcon className="w-3.5 h-3.5 text-[var(--youtube)]" />
              YouTube Destination Playlist
            </label>
            <input
              type="text"
              value={ytDestName}
              onChange={(e) => setYtDestName(e.target.value)}
              placeholder="e.g. My YouTube Music"
              className="input"
              maxLength={80}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
              <Globe size={11} />
              If this playlist doesn&apos;t exist on YouTube, it will be created automatically.
            </p>
          </div>
        ) : (
          <div>
            <label className="label flex items-center gap-1.5">
              <SpotifyIcon className="w-3.5 h-3.5 text-[var(--spotify)]" />
              Spotify Destination Playlist
            </label>
            <input
              type="text"
              value={spDestName}
              onChange={(e) => setSpDestName(e.target.value)}
              placeholder="e.g. My Spotify Music"
              className="input"
              maxLength={80}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
              <Globe size={11} />
              If this playlist doesn&apos;t exist on Spotify, it will be created automatically.
            </p>
          </div>
        )}

        {/* Sync interval */}
        <div>
          <label className="label flex items-center gap-1.5">
            <Clock size={13} className="text-[var(--text-muted)]" />
            Auto-Sync Interval
          </label>
          <select
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(Number(e.target.value))}
            className="input select"
          >
            {intervalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
            <Info size={11} />
            How often to check for new songs. Manual sync is always available on the dashboard.
          </p>
        </div>

        {/* Summary card */}
        {sourceName && destName && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Summary
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {direction === "spotify_to_youtube" ? (
                <>
                  <span className="badge badge-spotify">
                    <SpotifyIcon className="w-3 h-3" />
                    {sourceName}
                  </span>
                  <ArrowRight size={13} className="text-[var(--text-muted)]" />
                  <span className="badge badge-youtube">
                    <YouTubeIcon className="w-3 h-3" />
                    {destName}
                  </span>
                </>
              ) : (
                <>
                  <span className="badge badge-youtube">
                    <YouTubeIcon className="w-3 h-3" />
                    {sourceName}
                  </span>
                  <ArrowRight size={13} className="text-[var(--text-muted)]" />
                  <span className="badge badge-spotify">
                    <SpotifyIcon className="w-3 h-3" />
                    {destName}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="btn btn-ghost flex-1 justify-center">
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !isValid || loadingSpPlaylists || loadingYtPlaylists}
          className="btn btn-primary-gradient flex-[2] justify-center text-base py-3"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save &amp; Continue
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Step 4 — Launch                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function StepLaunch({
  config,
  authStatus,
  onBack,
}: {
  config: { spotifyPlaylist: string; youtubePlaylist: string; intervalSeconds: number; direction?: SyncDirection } | null;
  authStatus: AuthStatus | null;
  onBack: () => void;
}) {
  const direction = config?.direction ?? "spotify_to_youtube";
  const intervalLabel =
    config?.intervalSeconds === 300
      ? "5 minutes"
      : config?.intervalSeconds === 900
      ? "15 minutes"
      : config?.intervalSeconds === 1800
      ? "30 minutes"
      : config?.intervalSeconds === 3600
      ? "1 hour"
      : config?.intervalSeconds === 21600
      ? "6 hours"
      : config?.intervalSeconds === 86400
      ? "24 hours"
      : `${config?.intervalSeconds}s`;

  const checklist = [
    {
      done: authStatus?.spotify.connected,
      label: "Spotify connected",
      sub: authStatus?.spotify.displayName,
      color: "var(--spotify)",
    },
    {
      done: authStatus?.youtube.connected,
      label: "YouTube connected",
      sub: authStatus?.youtube.displayName,
      color: "#ff6666",
    },
    {
      done: Boolean(direction === "spotify_to_youtube" ? config?.spotifyPlaylist : config?.youtubePlaylist),
      label: `Source: ${direction === "spotify_to_youtube" ? (config?.spotifyPlaylist ?? "—") : (config?.youtubePlaylist ?? "—")}`,
      sub: direction === "spotify_to_youtube" ? "Spotify playlist" : "YouTube playlist",
      color: "#a78bfa",
    },
    {
      done: Boolean(direction === "spotify_to_youtube" ? config?.youtubePlaylist : config?.spotifyPlaylist),
      label: `Destination: ${direction === "spotify_to_youtube" ? (config?.youtubePlaylist ?? "—") : (config?.spotifyPlaylist ?? "—")}`,
      sub: direction === "spotify_to_youtube" ? "YouTube playlist (auto-created if needed)" : "Spotify playlist (auto-created if needed)",
      color: "#34d399",
    },
    {
      done: true,
      label: `Sync interval: ${intervalLabel}`,
      sub: "How often new songs are picked up",
      color: "#fbbf24",
    },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}
        >
          <Zap className="w-7 h-7" style={{ color: "#fbbf24" }} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-1">You&apos;re all set!</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Everything is configured. Head to the dashboard to start your first sync.
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="card mb-6">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Configuration summary
        </p>
        <div className="space-y-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: item.done ? `${item.color}20` : "var(--surface-overlay)",
                  border: `1px solid ${item.done ? `${item.color}40` : "var(--border)"}`,
                }}
              >
                {item.done ? (
                  <Check size={11} style={{ color: item.color }} />
                ) : (
                  <AlertCircle size={11} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white leading-tight">{item.label}</p>
                {item.sub && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vercel KV note */}
      <div className="alert alert-info mb-6">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold mb-1">Want persistent sync state?</p>
          <p className="leading-relaxed opacity-80">
            Enable <strong>Vercel KV</strong> (free) in your Vercel project under the Storage tab.
            This stores which songs have been synced so they&apos;re never duplicated, even across
            re-deployments.
          </p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn btn-ghost flex-1 justify-center">
          <ArrowLeft size={15} />
          Back
        </button>
        <Link
          href="/dashboard"
          className="btn btn-spotify flex-[2] justify-center text-base py-3"
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Setup Page                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function SetupPageContent() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [savedConfig, setSavedConfig] = useState<{
    spotifyPlaylist: string;
    youtubePlaylist: string;
    intervalSeconds: number;
    direction: SyncDirection;
  } | null>(null);

  // Parse any error/success params from OAuth callbacks
  const errorParam = searchParams.get("error");
  const spotifyConnected = searchParams.get("spotify") === "connected";
  const youtubeConnected = searchParams.get("youtube") === "connected";

  const errorMessages: Record<string, string> = {
    missing_credentials: "API keys are not configured. Please complete Step 1 (API Keys) first.",
    spotify_denied: "You denied Spotify access. Please try again and click Allow.",
    spotify_token_exchange_failed:
      "Spotify authentication failed. Make sure your Client ID and Client Secret are correct — go back to Step 1 to update them.",
    spotify_profile_failed:
      "Could not retrieve your Spotify profile. Please try reconnecting.",
    youtube_denied: "You denied YouTube access. Please try again and click Allow.",
    youtube_token_exchange_failed:
      "YouTube authentication failed. Make sure your Google Client ID and Client Secret are correct — go back to Step 1 to update them.",
    youtube_channel_failed:
      "Could not retrieve your YouTube channel. Make sure your Google account has a YouTube channel.",
  };

  const currentError = errorParam ? (errorMessages[errorParam] ?? `Error: ${errorParam}`) : null;

  // Fetch auth status on mount and after OAuth callbacks
  const fetchAuthStatus = useCallback(async () => {
    try {
      // Check if credentials are configured first
      const credsRes = await fetch("/api/auth/credentials");
      const credsData = await credsRes.json();
      if (!credsData.configured) {
        setStep(0);
        setLoadingAuth(false);
        return;
      }

      const res = await fetch("/api/auth/status");
      if (res.ok) {
        const data: AuthStatus = await res.json();
        setAuthStatus(data);

        // Auto-advance step based on connection state (steps shifted by 1 — step 0 is now API Keys)
        if (data.spotify.connected && data.youtube.connected && data.syncConfig) {
          setSavedConfig({
            spotifyPlaylist: data.syncConfig.spotifyPlaylist,
            youtubePlaylist: data.syncConfig.youtubePlaylist,
            intervalSeconds: data.syncConfig.intervalSeconds,
            direction: data.syncConfig.direction ?? "spotify_to_youtube",
          });
          setStep(4);
        } else if (data.spotify.connected && data.youtube.connected) {
          setStep(3);
        } else if (data.spotify.connected && youtubeConnected) {
          setStep(2); // show YT step with success
        } else if (spotifyConnected || data.spotify.connected) {
          setStep(2);
        } else {
          setStep(1);
        }
      }
    } catch {
      // Silently fail — auth status is non-critical for UI render
    } finally {
      setLoadingAuth(false);
    }
  }, [spotifyConnected, youtubeConnected]);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  // Show spinner while loading initial auth state
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner spinner-lg" />
          <p className="text-sm text-[var(--text-muted)]">Loading your account…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.04]"
          style={{
            background: "radial-gradient(ellipse, #1DB954 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Logo / back to home */}
      <div className="container-app max-w-xl mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline"
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "rgba(29,185,84,0.1)" }}>
            <Music2 size={13} className="text-[var(--spotify)]" />
          </div>
          SyncTube
        </Link>
      </div>

      {/* Card */}
      <div className="container-app max-w-xl">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Card header */}
          <div
            className="px-8 pt-8 pb-6"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
              Setup Wizard
            </p>
            <h1 className="text-xl font-black text-white">
              Connect &amp; Configure
            </h1>
          </div>

          {/* Card body */}
          <div className="px-8 pt-8 pb-8">
            <StepProgress current={step} />

            {step === 0 && (
              <StepCredentials onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <StepSpotify
                authStatus={authStatus}
                onNext={() => setStep(2)}
                error={currentError && (errorParam?.startsWith("spotify") || errorParam === "missing_credentials") ? currentError : null}
              />
            )}
            {step === 2 && (
              <StepYouTube
                authStatus={authStatus}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                error={currentError && (errorParam?.startsWith("youtube") ?? false) ? currentError : null}
              />
            )}
            {step === 3 && (
              <StepPlaylists
                onNext={(cfg) => {
                  setSavedConfig(cfg);
                  setStep(4);
                }}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <StepLaunch
                config={savedConfig}
                authStatus={authStatus}
                onBack={() => setStep(3)}
              />
            )}
          </div>
        </div>

        {/* Bottom help text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Need help?{" "}
            <a
              href="https://github.com/xafold/spotify-to-yt-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-secondary)] hover:text-white"
            >
              View the full documentation on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupPageContent />
    </Suspense>
  );
}
