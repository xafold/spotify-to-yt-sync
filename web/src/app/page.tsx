"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Music2,
  Youtube,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Zap,
  RefreshCw,
  Shield,
  Clock,
  Search,
  ListMusic,
  ChevronRight,
  ExternalLink,
  Star,
  Github,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                      */
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
/*  Navbar                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(8, 8, 8, 0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(42,42,42,0.8)" : "1px solid transparent",
      }}
    >
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#1DB954] to-[#FF0000] opacity-20" />
              <Music2 size={18} className="text-white relative z-10" />
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">
              SyncTube
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors duration-200 no-underline">
              How it works
            </a>
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors duration-200 no-underline">
              Features
            </a>
            <a
              href="https://github.com/xafold/spotify-to-yt-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors duration-200 no-underline flex items-center gap-1.5"
            >
              <Github size={14} />
              GitHub
            </a>
          </div>

          {/* CTA */}
          <Link
            href="/setup"
            className="btn btn-spotify btn-sm flex items-center gap-1.5"
          >
            Get Started
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Hero                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="hero-bg relative min-h-screen flex items-center pt-16 pb-24">
      {/* Ambient glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.06]"
          style={{
            background:
              "radial-gradient(ellipse, #1DB954 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(ellipse, #FF0000 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="container-app relative z-10 text-center">
        {/* Eyebrow badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
          style={{
            background: "rgba(29,185,84,0.08)",
            border: "1px solid rgba(29,185,84,0.2)",
          }}
        >
          <span className="status-dot status-dot-online" />
          <span className="text-[13px] font-medium text-[var(--spotify-light)]">
            Open source · Deploy in minutes
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6"
          style={{ animationDelay: "80ms" }}
        >
          <span className="text-white">Your music,</span>
          <br />
          <span className="text-gradient-spotify-yt">everywhere.</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="animate-fade-in-up text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ animationDelay: "160ms" }}
        >
          Sync music between Spotify and YouTube in either direction —
          Spotify&nbsp;→&nbsp;YouTube or YouTube&nbsp;→&nbsp;Spotify, automatically.
        </p>

        {/* CTA buttons */}
        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/setup"
            className="btn btn-spotify btn-lg w-full sm:w-auto"
            style={{ minWidth: "200px" }}
          >
            <SpotifyIcon className="w-5 h-5" />
            Start Syncing Free
            <ArrowRight size={16} />
          </Link>
          <a
            href="#how-it-works"
            className="btn btn-ghost btn-lg w-full sm:w-auto"
            style={{ minWidth: "180px" }}
          >
            See how it works
          </a>
        </div>

        {/* Platform logos */}
        <div
          className="animate-fade-in-up flex items-center justify-center gap-8"
          style={{ animationDelay: "320ms" }}
        >
          <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
            <SpotifyIcon className="w-5 h-5 text-[var(--spotify)]" />
            <span className="text-sm font-medium">Spotify</span>
          </div>
          <div className="w-px h-4 bg-[var(--border)]" />
          <div className="relative w-8 h-px flex items-center justify-center">
            <ArrowLeftRight size={16} className="text-[var(--text-muted)]" />
          </div>
          <div className="w-px h-4 bg-[var(--border)]" />
          <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
            <YouTubeIcon className="w-5 h-5 text-[var(--youtube)]" />
            <span className="text-sm font-medium">YouTube</span>
          </div>
        </div>

        {/* Floating mock card */}
        <div
          className="animate-fade-in-up mt-20 max-w-2xl mx-auto"
          style={{ animationDelay: "400ms" }}
        >
          <MockDashboardCard />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Mock Dashboard Preview Card                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function MockDashboardCard() {
  const tracks = [
    { name: "Blinding Lights", artist: "The Weeknd", status: "added" },
    { name: "As It Was", artist: "Harry Styles", status: "added" },
    { name: "Heat Waves", artist: "Glass Animals", status: "added" },
    { name: "Stay", artist: "The Kid LAROI, Justin Bieber", status: "pending" },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden text-left"
      style={{
        background: "rgba(17,17,17,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-[var(--text-muted)] font-medium">
          SyncTube — Dashboard
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="badge badge-success text-[11px]">
            <span className="status-dot status-dot-online w-1.5 h-1.5" />
            Live
          </span>
        </div>
      </div>

      {/* Sync progress bar */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <RefreshCw size={13} className="text-[var(--spotify)] animate-spin" style={{ animationDuration: "2s" }} />
            <span className="text-sm font-medium text-white">Syncing...</span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">3 / 4 songs</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: "75%" }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-[var(--text-muted)]">
            Liked Songs → My YT Music
          </span>
          <span className="text-[11px] text-[var(--spotify)]">75%</span>
        </div>
      </div>

      {/* Track list */}
      <div className="divide-y divide-[rgba(42,42,42,0.4)]">
        {tracks.map((track, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div
              className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center"
              style={{ background: "var(--surface-raised)" }}
            >
              <Music2 size={14} className="text-[var(--text-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{track.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{track.artist}</p>
            </div>
            {track.status === "added" ? (
              <span className="badge badge-success text-[10px]">
                <CheckCircle2 size={10} />
                Added
              </span>
            ) : (
              <span className="badge badge-neutral text-[10px]">
                <span className="spinner spinner-sm" />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]"
        style={{ background: "rgba(0,0,0,0.2)" }}>
        <span className="text-[11px] text-[var(--text-muted)]">
          245 songs synced total
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          Next sync in 4m 32s
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  How It Works                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <SpotifyIcon className="w-6 h-6" />,
      color: "var(--spotify)",
      bgColor: "rgba(29,185,84,0.1)",
      borderColor: "rgba(29,185,84,0.2)",
      title: "Connect Spotify",
      description:
        "Link your Spotify account with one click. We'll ask for read-only access to your playlists and Liked Songs — nothing more.",
    },
    {
      number: "02",
      icon: <YouTubeIcon className="w-6 h-6" />,
      color: "#ff6666",
      bgColor: "rgba(255,0,0,0.1)",
      borderColor: "rgba(255,0,0,0.2)",
      title: "Connect YouTube",
      description:
        "Authorize with your Google account. We create a YouTube playlist on your behalf and manage only that playlist.",
    },
    {
      number: "03",
      icon: <ListMusic size={24} />,
      color: "#a78bfa",
      bgColor: "rgba(167,139,250,0.1)",
      borderColor: "rgba(167,139,250,0.2)",
      title: "Choose Your Playlists",
      description:
        "Choose your sync direction, pick a source playlist, and name your destination. We'll create it automatically if it doesn't exist.",
    },
    {
      number: "04",
      icon: <Zap size={24} />,
      color: "#fbbf24",
      bgColor: "rgba(251,191,36,0.1)",
      borderColor: "rgba(251,191,36,0.2)",
      title: "Sit Back & Relax",
      description:
        "Hit Sync. Every song is found on YouTube and added to your playlist. New songs are detected automatically on your chosen schedule.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32">
      <div className="container-app">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--spotify)] uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Four steps to forever sync
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
            No technical knowledge required. The setup wizard walks you through
            every step with clear instructions.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div
              key={i}
              className="card relative group"
              style={{
                borderColor: step.borderColor,
                animationDelay: `${i * 80}ms`,
              }}
            >
              {/* Connector arrow (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-[11px] top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full items-center justify-center"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <ChevronRight size={12} className="text-[var(--text-muted)]" />
                </div>
              )}

              {/* Step number */}
              <span
                className="text-5xl font-black mb-4 block"
                style={{
                  color: step.color,
                  opacity: 0.15,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: step.bgColor,
                  color: step.color,
                  border: `1px solid ${step.borderColor}`,
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA below */}
        <div className="text-center mt-12">
          <Link
            href="/setup"
            className="btn btn-primary-gradient btn-lg inline-flex"
          >
            Start Setup Wizard
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Features Grid                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

function Features() {
  const features = [
    {
      icon: <Music2 size={22} />,
      color: "var(--spotify)",
      bg: "rgba(29,185,84,0.08)",
      title: "Liked Songs Support",
      description:
        "Sync Spotify Liked Songs or any playlist to YouTube, or sync a YouTube playlist back to Spotify — fully bidirectional.",
    },
    {
      icon: <CheckCircle2 size={22} />,
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.08)",
      title: "Zero Duplicates",
      description:
        "Each Spotify track is tracked by its unique URI. Songs are never added twice, even across multiple sync runs.",
    },
    {
      icon: <Search size={22} />,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.08)",
      title: "Smart YouTube Search",
      description:
        "Searches the YouTube Music category first, then falls back to a general search for the best match.",
    },
    {
      icon: <Clock size={22} />,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.08)",
      title: "Auto-Sync on Schedule",
      description:
        "Set your sync interval (5 min to 24 hrs). New songs added to Spotify are picked up automatically.",
    },
    {
      icon: <RefreshCw size={22} />,
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      title: "Auto-Create Playlists",
      description:
        "If your YouTube playlist doesn't exist yet, we create it for you. Just type a name and you're good to go.",
    },
    {
      icon: <Shield size={22} />,
      color: "#f87171",
      bg: "rgba(248,113,113,0.08)",
      title: "Privacy First",
      description:
        "Tokens are stored in encrypted, HTTP-only cookies. Your credentials never leave your own Vercel deployment.",
    },
    {
      icon: <Zap size={22} />,
      color: "#fb923c",
      bg: "rgba(251,146,60,0.08)",
      title: "Quota-Aware",
      description:
        "Built-in search delays respect YouTube's daily API quota. Progress is saved before any quota limit is hit.",
    },
    {
      icon: <Star size={22} />,
      color: "#e879f9",
      bg: "rgba(232,121,249,0.08)",
      title: "Beautiful Dashboard",
      description:
        "See exactly what's been synced, what's pending, and your full history — all in one clean interface.",
    },
  ];

  return (
    <section id="features" className="py-24 md:py-32" style={{ background: "var(--bg-secondary)" }}>
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[var(--spotify)] uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Everything you need
          </h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
            Built to be reliable, smart, and respectful of API limits. Everything
            the Python script does, but with a friendly face.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="card group hover:translate-y-[-2px] transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: feature.bg, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Tech Stack / Requirements Banner                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

function Requirements() {
  const items = [
    {
      label: "Spotify Developer App",
      sub: "Free at developer.spotify.com",
      color: "var(--spotify)",
      link: "https://developer.spotify.com/dashboard",
    },
    {
      label: "Google Cloud Project",
      sub: "Free YouTube Data API v3",
      color: "#ff6666",
      link: "https://console.cloud.google.com",
    },
    {
      label: "Vercel Account",
      sub: "Free hobby plan works great",
      color: "#a78bfa",
      link: "https://vercel.com",
    },
    {
      label: "Vercel KV (Redis)",
      sub: "Free 256 MB, auto-injected",
      color: "#34d399",
      link: "https://vercel.com/storage/kv",
    },
  ];

  return (
    <section className="py-16 border-y border-[var(--border)]">
      <div className="container-app">
        <p className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-10">
          What you'll need (all free tiers available)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex flex-col gap-1 no-underline group hover:translate-y-[-2px] transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <ExternalLink size={11} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
              </div>
              <p className="text-[13px] font-semibold text-white leading-tight">
                {item.label}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">{item.sub}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Final CTA                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, #1DB954 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container-app relative z-10 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
          style={{
            background: "rgba(29,185,84,0.08)",
            border: "1px solid rgba(29,185,84,0.2)",
          }}
        >
          <Zap size={12} className="text-[var(--spotify)]" />
          <span className="text-[13px] font-medium text-[var(--spotify-light)]">
            Deploy in under 10 minutes
          </span>
        </div>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-5">
          Ready to sync your music?
        </h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-lg mx-auto mb-10">
          Follow the step-by-step setup wizard — it explains every technical
          step clearly, even if you've never used a developer API before.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/setup" className="btn btn-spotify btn-lg w-full sm:w-auto">
            <SpotifyIcon className="w-5 h-5" />
            Open Setup Wizard
            <ArrowRight size={16} />
          </Link>
          <a
            href="https://github.com/xafold/spotify-to-yt-sync"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-lg w-full sm:w-auto"
          >
            <Github size={16} />
            View Source
          </a>
        </div>

        {/* Small trust note */}
        <p className="mt-8 text-xs text-[var(--text-muted)]">
          Open source · No data stored on our servers · Your own Vercel deployment
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Footer                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer
      className="border-t border-[var(--border)] py-8"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="container-app">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(29,185,84,0.15)" }}>
              <Music2 size={13} className="text-[var(--spotify)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">
              SyncTube
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/setup" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline">
              Setup
            </Link>
            <Link href="/dashboard" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline">
              Dashboard
            </Link>
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline"
            >
              Spotify Dev
            </a>
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors no-underline"
            >
              Google Cloud
            </a>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            MIT License · Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Requirements />
      <HowItWorks />
      <Features />
      <FinalCTA />
      <Footer />
    </main>
  );
}
