# 🎵 Spotify → YouTube Playlist Sync

Automatically mirrors a Spotify playlist (or your **Liked Songs**) to a YouTube playlist — and keeps it in sync by polling for new tracks on a configurable interval.

---

## ✨ Features

- Sync **any Spotify playlist** or your **Liked Songs** library to YouTube
- Auto-creates the YouTube playlist if it doesn't exist yet
- Tracks already-synced songs in a local state file — no duplicates
- Looks up songs by music category first, then falls back to a general search
- Fully configurable via `.env` file **or** CLI flags
- Runs continuously, checking for new tracks every N seconds (default: 5 min)

---

## 📋 Prerequisites

- Python 3.8+
- A [Spotify Developer](https://developer.spotify.com/dashboard) account
- A [Google Cloud](https://console.cloud.google.com/) account with the YouTube Data API v3 enabled

---

## 🚀 Setup

### 1. Clone the repository

```sh
git clone https://github.com/xafold/spotify-to-yt-sync.git
cd spotify-to-yt-sync
```

### 2. Install dependencies

```sh
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```sh
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Spotify credentials

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app.
2. Copy your **Client ID** and **Client Secret**.
3. Add `http://127.0.0.1:8888/callback` as a **Redirect URI** in the app settings.

### 4. Configure YouTube (Google OAuth) credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Navigate to **APIs & Services → Library** and enable the **YouTube Data API v3**.
3. Go to **APIs & Services → Credentials** and create an **OAuth 2.0 Client ID** (application type: *Desktop app*).
4. Download the JSON file and save it as **`client_secret.json`** in the project root.

### 5. Set up your environment

```sh
cp .env.example .env
```

Open `.env` and fill in your values:

```
SPOTIPY_CLIENT_ID=your_spotify_client_id
SPOTIPY_CLIENT_SECRET=your_spotify_client_secret
SPOTIPY_REDIRECT_URI=http://127.0.0.1:8888/callback

SPOTIFY_PLAYLIST_NAME=Liked Songs   # or use SPOTIFY_PLAYLIST_ID
YOUTUBE_PLAYLIST_NAME=Liked Songs   # auto-created if it doesn't exist
SYNC_INTERVAL_SECONDS=300
```

> **Note:** `SPOTIFY_PLAYLIST_NAME` takes priority over `SPOTIFY_PLAYLIST_ID`, and `YOUTUBE_PLAYLIST_NAME` takes priority over `YOUTUBE_PLAYLIST_ID`.

---

## 🎛️ Usage

### Run with `.env` configuration

```sh
python sync.py
```

### Run with CLI flags (override `.env`)

```sh
python sync.py --spotify-playlist "Liked Songs" --youtube-playlist "My YT Music" --interval 600
```

| Flag | Description |
|---|---|
| `--spotify-playlist` | Spotify playlist name (use `"Liked Songs"` for your library) |
| `--youtube-playlist` | YouTube playlist name (auto-created if missing) |
| `--interval` | Polling interval in seconds (default: `300`) |

### First run — authentication

- **Spotify:** Your browser will open automatically for OAuth. After authorizing, the token is cached locally in `.cache`.
- **YouTube:** Your browser will open for Google OAuth. After authorizing, the token is saved to `youtube_token.json` for future runs.

---

## 📁 Project Structure

```
spotify-to-yt-sync/
├── sync.py              # Main sync script
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variable template
├── .env                 # Your local secrets (never commit this)
├── client_secret.json   # Google OAuth credentials (never commit this)
├── youtube_token.json   # Saved YouTube token — auto-generated on first run
└── sync_state.json      # Tracks synced songs — auto-generated at runtime
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `SPOTIPY_CLIENT_ID` | ✅ | — | Spotify app Client ID |
| `SPOTIPY_CLIENT_SECRET` | ✅ | — | Spotify app Client Secret |
| `SPOTIPY_REDIRECT_URI` | ✅ | `http://127.0.0.1:8888/callback` | Spotify OAuth redirect URI |
| `SPOTIFY_PLAYLIST_NAME` | ✡ | — | Spotify playlist name (`"Liked Songs"` for library) |
| `SPOTIFY_PLAYLIST_ID` | ✡ | — | Spotify playlist ID (fallback if name not set) |
| `YOUTUBE_PLAYLIST_NAME` | ✡ | — | YouTube playlist name (auto-created if missing) |
| `YOUTUBE_PLAYLIST_ID` | ✡ | — | YouTube playlist ID (fallback if name not set) |
| `SYNC_INTERVAL_SECONDS` | ❌ | `300` | How often (seconds) to check for new songs |

> ✡ At least one Spotify source and one YouTube destination must be provided (either by name or ID).

---

## 🔒 Security Notes

The following files contain sensitive credentials and are listed in `.gitignore` — **never commit them**:

- `.env`
- `client_secret.json`
- `youtube_token.json`

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `spotipy` | Spotify Web API client |
| `google-api-python-client` | YouTube Data API v3 client |
| `google-auth-oauthlib` | Google OAuth 2.0 flow |
| `google-auth-httplib2` | HTTP transport for Google auth |
| `python-dotenv` | Load `.env` variables at runtime |

---

## 🛠️ How It Works

1. **Authenticate** with Spotify and YouTube (OAuth, browser-based on first run).
2. **Fetch** all tracks from the specified Spotify playlist or Liked Songs.
3. **Compare** against `sync_state.json` to find tracks that haven't been synced yet.
4. **Search** YouTube for each new track (by `"Song Name Artist Name"`), prioritising the Music category.
5. **Add** the top result to your YouTube playlist.
6. **Save** state, then sleep for `SYNC_INTERVAL_SECONDS` before repeating.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).