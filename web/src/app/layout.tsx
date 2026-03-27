import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify → YouTube Sync",
  description:
    "Automatically mirror your Spotify playlists and Liked Songs to YouTube. Set it up once, let it run forever.",
  keywords: [
    "spotify",
    "youtube",
    "playlist sync",
    "music",
    "liked songs",
    "automation",
  ],
  authors: [{ name: "Spotify YouTube Sync" }],
  openGraph: {
    title: "Spotify → YouTube Sync",
    description:
      "Automatically mirror your Spotify playlists to YouTube. Beautiful UI, zero friction.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spotify → YouTube Sync",
    description:
      "Automatically mirror your Spotify playlists to YouTube. Beautiful UI, zero friction.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="noise-overlay antialiased">{children}</body>
    </html>
  );
}
