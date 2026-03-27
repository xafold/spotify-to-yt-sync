# 🎵 SyncTube — Spotify → YouTube Web UI

A beautiful, minimal web interface for syncing your Spotify playlists and Liked Songs to YouTube. Built with Next.js 14 and deployable to Vercel in minutes.

---

## ✨ What This Does

- Connects your **Spotify** account (OAuth) and **YouTube** account (Google OAuth)
- Lets you pick any Spotify playlist — or your entire **Liked Songs** library — as the sync source
- Automatically finds each song on YouTube and adds it to a YouTube playlist you name
- Tracks which songs have already been synced so **no duplicates** are ever added
- Shows a live **progress bar** while syncing, plus a full **history log**
- Stores everything securely in encrypted cookies + optional **Vercel KV**

---

## 🚀 Deploy to Vercel

### Step 1 — Fork / clone the repo

```sh
git clone https://github.com/xafold/spotify-to-yt-sync.git
cd spotify-to-yt-sync/web
```

### Step 2 — Push the `web/` folder to your own GitHub repo

Vercel deploys from a Git repository. Either:

- Push the whole repo and set **Root Directory** to `web` in Vercel settings, **or**
- Copy only the `web/` folder into a new repo and push that.

### Step 3 — Create a new Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. If your repo contains the full project, set **Root Directory** → `web`
4. Framework preset will be detected as **Next.js** automatically
5. Click **Deploy** (it will fail on the first deploy — that's expected until you add env vars)

### Step 4 — Add Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `SESSION_SECRET` | Any random 32+ char string | Generate with `openssl rand -base64 32` |
| `APP_URL` | `https://your-project.vercel.app` | Your Vercel deployment URL (no trailing slash) |
| `SPOTIFY_CLIENT_ID` | From Spotify Developer Dashboard | See setup below |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard | See setup below |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | See setup below |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | See setup below |

> **Vercel KV variables** (`KV_URL`, `KV_REST_API_URL`, etc.) are injected **automatically** when you enable Vercel KV — you do not add them manually.

### Step 5 — Enable Vercel KV (recommended, free)

1. In your Vercel project → **Storage** tab
2. Click **Create Database** → choose **KV**
3. Follow the prompts — Vercel auto-injects the connection variables
4. Redeploy your project

Without Vercel KV the app still works, but sync state is in-memory only and resets on each deployment.

### Step 6 — Set up Spotify credentials

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App** → fill in any name and description
3. In app **Settings**, add this Redirect URI:
   ```
   https://your-project.vercel.app/api/auth/spotify/callback
   ```
4. Copy **Client ID** and **Client Secret** → paste into Vercel env vars

### Step 7 — Set up Google / YouTube credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a **New Project** (or use an existing one)
3. **APIs & Services → Library** → search **YouTube Data API v3** → **Enable**
4. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Fill in App name, support email, developer contact email
   - Add scope: `https://www.googleapis.com/auth/youtube`
   - Add your Google account as a **Test User**
5. **APIs & Services → Credentials → + Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://your-project.vercel.app/api/auth/youtube/callback
     ```
   - Click **Create**
6. Copy **Client ID** and **Client Secret** → paste into Vercel env vars

### Step 8 — Redeploy

After adding all environment variables, trigger a new deployment:

```
Vercel Dashboard → Deployments → Redeploy
```

### Step 9 — Open the app and follow the Setup Wizard

Visit `https://your-project.vercel.app` and click **Get Started**. The 4-step wizard will walk you through everything.

---

## 🏠 Local Development

```sh
cd web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local and fill in your values

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local OAuth callbacks, add these redirect URIs to your Spotify and Google apps:
- `http://localhost:3000/api/auth/spotify/callback`
- `http://localhost:3000/api/auth/youtube/callback`

And set `APP_URL=http://localhost:3000` in `.env.local`.

---

## 📁 Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Landing page
│   │   ├── setup/page.tsx              ← 4-step setup wizard
│   │   ├── dashboard/page.tsx          ← Sync control center
│   │   ├── globals.css                 ← Dark theme styles
│   │   ├── layout.tsx                  ← Root layout
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── spotify/            ← Initiate Spotify OAuth
│   │       │   ├── spotify/callback/   ← Handle Spotify OAuth callback
│   │       │   ├── youtube/            ← Initiate YouTube OAuth
│   │       │   ├── youtube/callback/   ← Handle YouTube OAuth callback
│   │       │   ├── status/             ← Return current auth state
│   │       │   └── logout/             ← Clear session
│   │       ├── playlists/
│   │       │   └── spotify/            ← List user's Spotify playlists
│   │       └── sync/
│   │           ├── route.ts            ← Run sync (chunked, POST)
│   │           ├── status/             ← Get sync stats + history
│   │           └── config/             ← GET/POST sync configuration
│   ├── lib/
│   │   ├── session.ts                  ← iron-session config
│   │   ├── spotify.ts                  ← Spotify Web API helpers
│   │   ├── youtube.ts                  ← YouTube Data API helpers
│   │   └── kv.ts                       ← Vercel KV / in-memory storage
│   └── types/
│       └── index.ts                    ← Shared TypeScript types
├── .env.example                        ← Environment variable template
├── vercel.json                         ← Vercel deployment config
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | ✅ | 32+ char secret for encrypting session cookies |
| `APP_URL` | ✅ | Base URL of your app (no trailing slash) |
| `SPOTIFY_CLIENT_ID` | ✅ | Spotify OAuth app Client ID |
| `SPOTIFY_CLIENT_SECRET` | ✅ | Spotify OAuth app Client Secret |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth 2.0 Client Secret |
| `KV_URL` | ⬡ | Auto-injected by Vercel KV |
| `KV_REST_API_URL` | ⬡ | Auto-injected by Vercel KV |
| `KV_REST_API_TOKEN` | ⬡ | Auto-injected by Vercel KV |
| `KV_REST_API_READ_ONLY_TOKEN` | ⬡ | Auto-injected by Vercel KV |
| `SYNC_INTERVAL_SECONDS` | ❌ | Default sync interval (default: `300`) |

> ⬡ = Auto-injected when Vercel KV is enabled; do not set manually.

---

## ⚙️ How the Sync Works

1. The dashboard calls `POST /api/sync` in **chunks of 15 tracks** to stay within Vercel's serverless timeout limits
2. Each chunk searches YouTube for each Spotify track (Music category first, then general)
3. Found videos are added to the configured YouTube playlist
4. Processed Spotify track URIs are saved to Vercel KV so they are never re-added
5. The client loops through chunks until `done: true` is returned
6. On YouTube quota exhaustion, progress is saved and a clear message is shown

### Syncing large playlists

Vercel's Hobby plan allows up to **60 seconds per serverless function call**. With a 1.5-second delay between YouTube searches:

- ~40 tracks per chunk call (15 tracks × ~2 API calls × 1.5s = ~45s)
- The client automatically continues with the next chunk
- For a 500-song library this takes ~17 chunk calls — the UI handles this automatically

### YouTube API quota

The YouTube Data API v3 has a daily quota of **10,000 units** (free). Each search costs 100 units, so you get ~100 searches per day. The app adds a 1.5-second delay between searches to spread usage.

If you exceed the quota, the app:
- Shows a clear warning
- Saves all progress made so far
- Allows you to resume the next day without re-syncing already-processed tracks

---

## 🔒 Security

- Spotify and YouTube OAuth tokens are stored in **HTTP-only, encrypted cookies** via `iron-session` — they are never accessible to client-side JavaScript
- All API routes validate the session before processing requests
- Your credentials never leave your own Vercel deployment
- The `SESSION_SECRET` should be a strong random value (32+ characters)

---

## 🛠️ Tech Stack

| Package | Purpose |
|---|---|
| `next` 14 | Full-stack framework (App Router) |
| `react` 18 | UI library |
| `iron-session` | Encrypted cookie sessions |
| `@vercel/kv` | Redis-backed sync state storage |
| `lucide-react` | Icons |
| `tailwindcss` | Utility-first CSS |
| `typescript` | Type safety |

---

## 🐛 Troubleshooting

### "Spotify connection failed" / "YouTube connection failed"
- Double-check that the Redirect URIs in your Spotify/Google app settings **exactly match** `APP_URL/api/auth/spotify/callback` and `APP_URL/api/auth/youtube/callback`
- Make sure `APP_URL` does **not** have a trailing slash
- Verify that all four env vars (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are set in Vercel

### "YouTube channel failed" after Google OAuth
- Make sure your Google account has a YouTube channel (some accounts don't)
- Confirm your Google account is added as a **Test User** in the OAuth consent screen (while your app is in Testing mode)

### Sync stops after a few tracks
- You have likely hit the **YouTube API daily quota** (10,000 units)
- The quota resets at **midnight Pacific Time**
- Your progress is saved — run sync again the next day

### Duplicate songs appearing
- Enable **Vercel KV** in your project's Storage tab — without it, sync state is lost on each deployment
- If songs were duplicated before enabling KV, you can manually remove them from the YouTube playlist

### Build fails locally
- Make sure you are in the `web/` directory: `cd web && npm install && npm run build`
- Node.js 18+ is required

---

## 📄 License

MIT — open source and free to use, modify, and deploy.