# YT Channel Bulk Downloader

A local web app to browse a YouTube channel and bulk-download videos at the highest quality using `yt-dlp` + `ffmpeg`.

## Prerequisites

Install the required tools (Windows):

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
winget install DenoLand.Deno   # recommended by yt-dlp for YouTube
```

Verify:
```powershell
yt-dlp --version
ffmpeg -version
node -v   # requires 20+
```

---

## Setup

### 1. Server

```powershell
cd server
npm install
copy .env.example .env
# Edit .env if you want to change PORT, DOWNLOAD_DIR, etc.
npm run dev
# → http://localhost:4000
```

### 2. Web

```powershell
cd web
npm install
copy .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

### server/.env

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed web origin |
| `DOWNLOAD_DIR` | `../downloads` | Where files are saved |
| `MAX_CONCURRENT` | `3` | Max simultaneous downloads |
| `PAGE_SIZE` | `30` | Videos per page |
| `YTDLP_PATH` | `yt-dlp` | Path to yt-dlp binary |
| `YTDLP_COOKIES_FROM_BROWSER` | _(unset)_ | Browser to pull cookies from (e.g. `chrome`) — needed for age-restricted videos |

### web/.env.local

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |

---

## Usage

1. Open `http://localhost:3000`
2. Enter a YouTube channel (handle `@MrBeast`, full URL, or plain name)
3. Browse Videos / Shorts tabs, sort by Latest / Popular / Oldest
4. Click any card to download — progress shown live
5. Use **Select** mode + **Download selected** for bulk downloads

---

## Troubleshooting

### yt-dlp outdated / 403 errors
YouTube changes its format regularly. Update yt-dlp:
```powershell
yt-dlp -U
```

### ffmpeg missing / merge fails
Ensure `ffmpeg` is on your PATH:
```powershell
winget install Gyan.FFmpeg
# Restart terminal
ffmpeg -version
```

### Age-restricted videos
Set `YTDLP_COOKIES_FROM_BROWSER=chrome` (or `firefox`, `edge`) in `server/.env`.  
You must be logged into YouTube in that browser.

### Download directory
Files are saved to the `downloads/` folder at the project root (or `DOWNLOAD_DIR`).  
The server creates it automatically on startup.

### Server restart mid-download
Jobs are in-memory only. After a restart, in-progress downloads show **Failed** in the UI — click **Retry**.

---

## Project Structure

```
yt-bulk-downloader/
  docs/                   Spec files
  server/
    src/
      index.ts            Express app + graceful shutdown
      types.ts            Shared types
      config.ts           Env + constants
      lib/validate.ts     Zod schemas
      lib/errors.ts       AppError + error middleware
      services/ytdlp.ts   spawn helpers
      services/resolveChannel.ts
      services/videos.ts  List + sort + paginate
      services/cache.ts   TTL cache
      services/queue.ts   Job queue + concurrency
      routes/channel.ts
      routes/videos.ts
      routes/download.ts
      routes/progress.ts  SSE
      routes/file.ts
  web/
    app/layout.tsx
    app/page.tsx
    app/globals.css
    components/           SearchBar, ChannelHeader, Tabs, SortChips,
                          VideoCard, VideoGrid, Skeleton, Toast, SelectionBar
    hooks/                useChannel, useVideos, useDownload
    lib/                  api.ts, types.ts, format.ts
  downloads/              Downloaded files (gitignored)
```

---

## Legal

Only download content you own or have permission to download. Downloading others' videos may violate YouTube's Terms of Service and copyright law.
