#!/usr/bin/env python3
"""
Spotify -> YouTube Playlist Sync Script

Watches a Spotify playlist for new songs and automatically adds them
to a corresponding YouTube playlist.

Setup:
  1. Copy .env.example to .env and fill in your credentials
  2. Get Spotify credentials from https://developer.spotify.com/dashboard
  3. Get YouTube OAuth credentials from https://console.cloud.google.com/
     - Create a project, enable YouTube Data API v3
     - Create OAuth 2.0 Client ID (Desktop app)
     - Download the JSON and save as client_secret.json
  4. pip install -r requirements.txt
  5. python sync.py
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/youtube"]
STATE_FILE = Path(__file__).parent / "sync_state.json"
CLIENT_SECRET_FILE = Path(__file__).parent / "client_secret.json"
YOUTUBE_TOKEN_FILE = Path(__file__).parent / "youtube_token.json"


def get_spotify_client():
    """Authenticate with Spotify and return a client."""
    sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=os.getenv("SPOTIPY_CLIENT_ID"),
        client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
        redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI", "http://127.0.0.1:8888/callback"),
        scope="playlist-read-private playlist-read-collaborative user-library-read",
    ))
    return sp


def get_youtube_client():
    """Authenticate with YouTube and return an API client."""
    creds = None

    if YOUTUBE_TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(YOUTUBE_TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CLIENT_SECRET_FILE.exists():
                print(f"Error: {CLIENT_SECRET_FILE} not found.")
                print("Download your OAuth 2.0 Client ID JSON from Google Cloud Console")
                print("and save it as client_secret.json in this directory.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET_FILE), SCOPES)
            creds = flow.run_local_server(port=8080)

        with open(YOUTUBE_TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)


def load_state():
    """Load the set of already-synced Spotify track URIs."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"synced_tracks": []}


def save_state(state):
    """Persist the synced track list."""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def find_spotify_playlist_by_name(sp, name):
    """Find a Spotify playlist by name from the current user's playlists. Returns playlist ID or None."""
    offset = 0
    while True:
        results = sp.current_user_playlists(limit=50, offset=offset)
        for playlist in results["items"]:
            if playlist["name"].strip().lower() == name.strip().lower():
                return playlist["id"]
        if not results.get("next"):
            break
        offset += 50
    return None


def get_liked_songs(sp):
    """Fetch all Liked Songs from the current user."""
    tracks = []
    results = sp.current_user_saved_tracks(limit=50)
    while results:
        for item in results["items"]:
            track = item.get("track")
            if track and track.get("name"):
                artists = ", ".join(a["name"] for a in track["artists"])
                tracks.append({
                    "uri": track["uri"],
                    "name": track["name"],
                    "artist": artists,
                })
        results = sp.next(results) if results.get("next") else None
    return tracks


def get_spotify_tracks(sp, playlist_id):
    """Fetch all tracks from a Spotify playlist. Returns list of (uri, name, artist)."""
    tracks = []
    results = sp.playlist_tracks(playlist_id)
    while results:
        for item in results["items"]:
            track = item.get("track")
            if track and track.get("name"):
                artists = ", ".join(a["name"] for a in track["artists"])
                tracks.append({
                    "uri": track["uri"],
                    "name": track["name"],
                    "artist": artists,
                })
        results = sp.next(results) if results.get("next") else None
    return tracks


def search_youtube(youtube, query):
    """Search YouTube for a song and return the top video ID, or None."""
    response = youtube.search().list(
        part="snippet",
        q=query,
        type="video",
        maxResults=1,
        videoCategoryId="10",  # Music category
    ).execute()

    items = response.get("items", [])
    if not items:
        # Retry without music category filter
        response = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=1,
        ).execute()
        items = response.get("items", [])

    if items:
        return items[0]["id"]["videoId"], items[0]["snippet"]["title"]
    return None, None


def add_to_youtube_playlist(youtube, playlist_id, video_id):
    """Add a video to a YouTube playlist."""
    youtube.playlistItems().insert(
        part="snippet",
        body={
            "snippet": {
                "playlistId": playlist_id,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": video_id,
                },
            }
        },
    ).execute()


def sync_once(sp, youtube, spotify_playlist_id, youtube_playlist_id, is_liked_songs=False):
    """Run one sync cycle. Returns the number of new songs added."""
    state = load_state()
    synced = set(state["synced_tracks"])

    if is_liked_songs:
        spotify_tracks = get_liked_songs(sp)
    else:
        spotify_tracks = get_spotify_tracks(sp, spotify_playlist_id)
    new_count = 0

    for track in spotify_tracks:
        if track["uri"] in synced:
            continue

        query = f"{track['name']} {track['artist']}"
        print(f"  Searching YouTube for: {query}")
        video_id, yt_title = search_youtube(youtube, query)

        if video_id:
            try:
                add_to_youtube_playlist(youtube, youtube_playlist_id, video_id)
                print(f"  + Added: {yt_title}")
                new_count += 1
            except Exception as e:
                print(f"  ! Error adding to playlist: {e}")
                continue
        else:
            print(f"  ? Not found on YouTube: {query}")

        synced.add(track["uri"])

    state["synced_tracks"] = list(synced)
    save_state(state)
    return new_count


def find_youtube_playlist_by_name(youtube, name):
    """Find a YouTube playlist by name. Returns playlist ID or None."""
    next_page = None
    while True:
        response = youtube.playlists().list(
            part="snippet",
            mine=True,
            maxResults=50,
            pageToken=next_page,
        ).execute()
        for playlist in response.get("items", []):
            if playlist["snippet"]["title"].strip().lower() == name.strip().lower():
                return playlist["id"]
        next_page = response.get("nextPageToken")
        if not next_page:
            break
    return None


def create_youtube_playlist(youtube, name):
    """Create a new public YouTube playlist and return its ID."""
    response = youtube.playlists().insert(
        part="snippet,status",
        body={
            "snippet": {"title": name},
            "status": {"privacyStatus": "public"},
        },
    ).execute()
    return response["id"]


def main():
    parser = argparse.ArgumentParser(description="Sync a Spotify playlist to YouTube")
    parser.add_argument("--spotify-playlist", help="Spotify playlist name (e.g., 'Liked Songs', '🤗')")
    parser.add_argument("--youtube-playlist", help="YouTube playlist name (auto-created if missing)")
    parser.add_argument("--interval", type=int, help="Sync interval in seconds (default: 300)")
    args = parser.parse_args()

    # CLI args take priority over .env
    spotify_playlist_name = args.spotify_playlist or os.getenv("SPOTIFY_PLAYLIST_NAME")
    spotify_playlist_id = os.getenv("SPOTIFY_PLAYLIST_ID")
    youtube_playlist_name = args.youtube_playlist or spotify_playlist_name or os.getenv("YOUTUBE_PLAYLIST_NAME")
    youtube_playlist_id = os.getenv("YOUTUBE_PLAYLIST_ID")
    interval = args.interval or int(os.getenv("SYNC_INTERVAL_SECONDS", "300"))

    is_liked_songs = spotify_playlist_name and spotify_playlist_name.strip().lower() == "liked songs"

    print("Authenticating with Spotify...")
    sp = get_spotify_client()

    # Resolve Spotify playlist: name takes priority over ID
    if is_liked_songs:
        print("Using Spotify Liked Songs")
    elif spotify_playlist_name:
        print(f"Looking up Spotify playlist: '{spotify_playlist_name}'...")
        spotify_playlist_id = find_spotify_playlist_by_name(sp, spotify_playlist_name)
        if not spotify_playlist_id:
            print(f"Error: Spotify playlist '{spotify_playlist_name}' not found.")
            sys.exit(1)
        print(f"  Found: {spotify_playlist_id}")
    elif not spotify_playlist_id:
        print("Error: Set SPOTIFY_PLAYLIST_NAME or SPOTIFY_PLAYLIST_ID in your .env file.")
        sys.exit(1)

    print("Authenticating with YouTube...")
    youtube = get_youtube_client()

    # Resolve YouTube playlist: name takes priority over ID
    if youtube_playlist_name:
        print(f"Looking up YouTube playlist: '{youtube_playlist_name}'...")
        youtube_playlist_id = find_youtube_playlist_by_name(youtube, youtube_playlist_name)
        if not youtube_playlist_id:
            print(f"  YouTube playlist '{youtube_playlist_name}' not found. Creating it...")
            youtube_playlist_id = create_youtube_playlist(youtube, youtube_playlist_name)
            print(f"  Created: {youtube_playlist_id}")
        else:
            print(f"  Found: {youtube_playlist_id}")
    elif not youtube_playlist_id:
        print("Error: Set YOUTUBE_PLAYLIST_NAME or YOUTUBE_PLAYLIST_ID in your .env file.")
        sys.exit(1)

    print(f"\nSyncing Spotify '{spotify_playlist_name or spotify_playlist_id}' -> YouTube '{youtube_playlist_name or youtube_playlist_id}'")
    print(f"Checking every {interval} seconds. Press Ctrl+C to stop.\n")

    while True:
        try:
            print(f"[{time.strftime('%H:%M:%S')}] Checking for new songs...")
            added = sync_once(sp, youtube, spotify_playlist_id, youtube_playlist_id, is_liked_songs)
            if added:
                print(f"  Synced {added} new song(s).")
            else:
                print("  Already in sync.")
        except Exception as e:
            print(f"  Error during sync: {e}")

        try:
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nStopping sync.")
            break


if __name__ == "__main__":
    main()
