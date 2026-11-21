# Technical Spec

## 1. Stack
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Backend: Node.js 20+, Express, TypeScript, zod (validation), cors, express-rate-limit
- Engine: `yt-dlp` + `ffmpeg` (called with `child_process.spawn`, args array, NEVER a shell string)
- Realtime: Server-Sent Events (SSE)
- State: in-memory Maps (jobs, cache). No DB in v1.

## 2. Folder structure
```
yt-bulk-downloader/
  docs/                      (this pack)
  CLAUDE.md  AGENTS.md  .cursorrules
  server/
    package.json  tsconfig.json  .env.example
    src/
      index.ts               express app, cors, routes, cleanup timer
      types.ts               shared types
      config.ts              env + constants
      lib/validate.ts        zod schemas, videoId regex
      lib/errors.ts          AppError + error middleware + yt-dlp stderr mapping
      services/ytdlp.ts      spawn helpers (runJson, runDownload)
      services/resolveChannel.ts
      services/videos.ts     list + sort + paginate
      services/cache.ts      TTL cache
      services/queue.ts      job queue, concurrency limit, emitter
      routes/channel.ts  routes/videos.ts  routes/download.ts  routes/progress.ts  routes/file.ts
  web/
    package.json  .env.local.example
    app/layout.tsx  app/page.tsx  app/globals.css
    components/SearchBar.tsx ChannelHeader.tsx Tabs.tsx SortChips.tsx VideoGrid.tsx VideoCard.tsx Toast.tsx SelectionBar.tsx Skeleton.tsx
    hooks/useChannel.ts useVideos.ts useDownload.ts
    lib/api.ts types.ts format.ts
  downloads/                 (gitignored)
```

## 3. Types (server/src/types.ts, mirror in web/lib/types.ts)
```ts
export type Tab = 'videos' | 'shorts';
export type Sort = 'latest' | 'popular' | 'oldest';

export interface ChannelInfo {
  id: string;            // UC...
  name: string;
  handle: string | null; // @name
  avatar: string | null;
  url: string;           // https://www.youtube.com/channel/UC...
}

export interface VideoItem {
  id: string;            // 11 chars
  title: string;
  durationSec: number | null;
  viewCount: number | null;
  thumbnail: string;     // https://i.ytimg.com/vi/{id}/mqdefault.jpg
  publishedText: string | null; // only if available, else null (hide in UI)
  isShort: boolean;
}

export interface VideosPage {
  items: VideoItem[];
  page: number;
  hasMore: boolean;
}

export type JobStatus = 'queued' | 'downloading' | 'merging' | 'done' | 'failed';

export interface Job {
  jobId: string;
  videoId: string;
  status: JobStatus;
  percent: number;       // 0-100
  speed: string | null;  // "5.2MiB/s"
  eta: string | null;
  fileName: string | null;
  error: string | null;
  createdAt: number;
}
```

## 4. API contract
All errors return `{ "error": { "code": string, "message": string } }` with proper HTTP status.

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | /api/health | | `{ ok: true, ytdlp: "<version>", ffmpeg: true }` |
| GET | /api/channel?q= | q = name/handle/URL (max 200 chars) | `ChannelInfo` |
| GET | /api/videos?channel=&tab=&sort=&page= | channel = UC id, tab default videos, sort default latest, page >= 1 | `VideosPage` |
| POST | /api/download | `{ videoId }` | `{ jobId }` (201). If same video already done, return existing done job |
| POST | /api/download/batch | `{ videoIds: string[] }` (max 50) | `{ jobIds: string[] }` |
| GET | /api/progress/:jobId | | SSE stream of `Job` JSON, closes on done/failed. Heartbeat comment every 15s |
| GET | /api/file/:jobId | | File stream with `Content-Disposition: attachment`. 404 if not done |

Error codes: `INVALID_INPUT`, `CHANNEL_NOT_FOUND`, `VIDEO_UNAVAILABLE`, `AGE_RESTRICTED`, `PRIVATE_VIDEO`, `NETWORK_ERROR`, `YTDLP_MISSING`, `RATE_LIMITED`, `INTERNAL`.

## 5. Channel resolution (services/resolveChannel.ts)
1. Trim input. Reject empty or over 200 chars.
2. Normalize:
   - Starts with `http` -> must be hostname `youtube.com` / `www.youtube.com` / `m.youtube.com`, else INVALID_INPUT. Use the URL as is (strip query/hash, strip trailing `/videos|/shorts|/featured`).
   - Starts with `@` -> `https://www.youtube.com/<input>`
   - Starts with `UC` and 24 chars -> `https://www.youtube.com/channel/<input>`
   - Anything else (plain name) -> try `https://www.youtube.com/@<name-without-spaces>`; if not found, fall back to `ytsearch1:<name>` and take `channel_id` of the first result.
3. Fetch channel info with:
   `yt-dlp --flat-playlist -J --playlist-items 1 --no-warnings "<url>/videos"`
   Read `channel_id`, `channel` (or `uploader`), `uploader_id` (handle), and the avatar from `thumbnails` (id `avatar_uncropped`, else the first square thumbnail).
4. Cache result 30 min by normalized input.

## 6. Listing videos (services/videos.ts)
- Page size 30. Page N -> `--playlist-items ((N-1)*30+1)-(N*30)`.
- Base command:
  `yt-dlp --flat-playlist -J --no-warnings --playlist-items A-B "https://www.youtube.com/channel/<id>/<videos|shorts>"`
- Map entries to `VideoItem`. Build thumbnail URL from the id (do not trust the thumbnails array). `hasMore = entries.length === 30`.
- Sorting:
  - latest = default order.
  - popular = try URL `...?view=0&sort=p`. **Verify it works with the installed yt-dlp.** If the order is not by views, fallback: fetch the whole flat list once (cache it 10 min), sort by `view_count` desc, then slice pages.
  - oldest = same approach: try `?view=0&sort=da`, else fetch the full list, reverse, slice pages.
- Flat mode often has no upload date, so `publishedText` can be null. UI must hide it gracefully.
- Cache each (channel, tab, sort, page) for 10 min.

## 7. Download (services/ytdlp.ts, services/queue.ts)
Command (args array):
```
yt-dlp
  --no-playlist
  -f "bv*+ba/b"
  --merge-output-format mp4
  --newline
  --progress-template "download:PROGRESS|%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress._speed_str)s|%(progress._eta_str)s"
  --print after_move:"FILEPATH|%(filepath)s"
  -o "<DOWNLOAD_DIR>/%(title).120B [%(id)s].%(ext)s"
  --windows-filenames
  "https://www.youtube.com/watch?v=<videoId>"
```
Notes:
- Highest quality: `bv*+ba/b` picks best video + best audio. If a result is WebM/VP9 4K, `--merge-output-format mp4` may fall back to mkv; accept the actual extension and use the real file name.
- Percent = downloaded / (total or estimate) * 100. video and audio download as two streams, so the percent restarts once. Show status `downloading` with percent capped at 99 until the process exits, then `merging` -> `done`. Keep it simple, do not over-engineer.
- Parse stdout line by line. Lines starting with `PROGRESS|` update the job. Lines starting with `FILEPATH|` give the final file.
- Exit code 0 + file exists -> `done`. Else map stderr to an error code:
  - contains "Private video" -> PRIVATE_VIDEO
  - contains "Sign in to confirm your age" -> AGE_RESTRICTED
  - contains "Video unavailable" / "removed" -> VIDEO_UNAVAILABLE
  - contains "Unable to download" / "Temporary failure" / "timed out" -> NETWORK_ERROR
  - else INTERNAL (log full stderr on the server only, send a short message to the client)
- Queue: max `MAX_CONCURRENT=3`. FIFO. EventEmitter per job for SSE.
- Duplicate: same `videoId` with status queued/downloading/merging -> return the existing job. Status done and file exists -> return the done job.
- Cleanup: every hour delete files and jobs older than 24h.
- Kill child processes on server shutdown (SIGINT/SIGTERM).

## 8. SSE (routes/progress.ts)
Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`. Send the current job state immediately, then every update as `data: <json>\n\n`. Remove listeners on `req.on('close')`.

## 9. Security rules
- No shell. `spawn('yt-dlp', args)` only.
- `videoId` must match `/^[A-Za-z0-9_-]{11}$/`.
- Channel input hostname allow-list (see section 5). Never pass user input as a yt-dlp flag: always put `--` before the URL argument.
- `/api/file/:jobId` looks up the path from the job Map. Never build a path from user input. Confirm the resolved path starts with `DOWNLOAD_DIR`.
- CORS: only `http://localhost:3000` (env `CORS_ORIGIN`).
- Rate limit: 60 requests/min per IP on `/api`, 10 download starts/min.
- Body size limit 10kb.

## 10. Config (server/.env.example)
```
PORT=4000
CORS_ORIGIN=http://localhost:3000
DOWNLOAD_DIR=../downloads
MAX_CONCURRENT=3
PAGE_SIZE=30
YTDLP_PATH=yt-dlp
# Optional, for age-restricted videos (use a browser you are logged in with):
# YTDLP_COOKIES_FROM_BROWSER=chrome
```
web/.env.local.example: `NEXT_PUBLIC_API_URL=http://localhost:4000`

## 11. Setup commands (Windows)
```
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
winget install DenoLand.Deno
yt-dlp --version
ffmpeg -version
```
Recent yt-dlp versions recommend a JavaScript runtime (Deno) for YouTube. Keep yt-dlp updated (`yt-dlp -U`) because YouTube changes often and old versions break.

## 12. Frontend behavior
- State machine: `idle -> loadingChannel -> channelReady | error`.
- Changing tab or sort resets the list to page 1 and scrolls to the top.
- Infinite scroll with `IntersectionObserver` on a sentinel div. Ignore duplicates by video id.
- Clicking a card calls POST /api/download, opens an `EventSource` for the jobId, updates the card. On `done`, create a hidden `<a href="/api/file/:jobId" download>` and click it. Close the EventSource on done/failed/unmount.
- Per-card state is keyed by video id and kept in a top-level Map so it survives re-renders and tab switches.
- Select mode: checkbox on every card, sticky bar "N selected, Download selected, Clear".
- Accessibility: cards are `<button>` or have `role="button"` + keyboard Enter/Space, visible focus ring, alt text on thumbnails.

## 13. Edge cases to handle
- Channel with zero videos / no Shorts tab -> empty state
- Livestream or premiere upcoming -> mark "Not downloadable yet"
- Members-only video -> VIDEO_UNAVAILABLE message
- User double-clicks a card -> only one job
- Server restarted mid-download -> jobs lost, UI shows failed + Retry
- Very long titles -> truncate with 2-line clamp
- Network drop during SSE -> EventSource retry, then fall back to GET job status
