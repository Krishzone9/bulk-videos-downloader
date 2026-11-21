# Build Prompts (paste one at a time, in order)

Tip: Start every new chat session with:
> "Read CLAUDE.md, docs/01_PRD.md and docs/02_TECH_SPEC.md first. Then do the step below."

Use a strong model (Claude Sonnet/Opus or equivalent) in Agent/Composer mode so it can run commands.

---

## Step 0: Environment check
**Prompt:**
> Check that Node 20+, yt-dlp and ffmpeg are installed (run `node -v`, `yt-dlp --version`, `ffmpeg -version`). If any is missing, give me the Windows install command and wait. Then test: `yt-dlp --flat-playlist -J --playlist-items 1-3 "https://www.youtube.com/@MrBeast/videos"` and show me the fields available (id, title, duration, view_count, channel_id, thumbnails). Also check whether `?view=0&sort=p` and `?view=0&sort=da` change the order of results. Report what works.

**Done when:** all three tools are installed and you know which sort URLs work.

---

## Step 1: Scaffold
**Prompt:**
> Create the monorepo exactly as in section 2 of the tech spec. Initialize `server` (Express, TypeScript, zod, cors, express-rate-limit, tsx for dev) and `web` (Next.js App Router, TypeScript, Tailwind). Add scripts: `dev`, `build`, `typecheck`. Add `.gitignore` (node_modules, downloads, .env*), `.env.example` files, and `GET /api/health` that returns the yt-dlp version and whether ffmpeg exists. Do not build any other feature yet.

**Done when:** both dev servers start and `curl localhost:4000/api/health` returns ok.

---

## Step 2: Backend core (types, config, errors, yt-dlp helper)
**Prompt:**
> Implement `types.ts`, `config.ts`, `lib/validate.ts`, `lib/errors.ts` and `services/ytdlp.ts` per the spec. `ytdlp.ts` needs `runJson(args)` (spawn, collect stdout, parse JSON, timeout 60s, map stderr to AppError) and a streaming runner for downloads. Add the error middleware. Add a small TTL cache in `services/cache.ts`. Write unit tests for the stderr-to-error-code mapping and the input validators using vitest.

**Done when:** `npm run typecheck` and tests pass.

---

## Step 3: Channel endpoint
**Prompt:**
> Implement `services/resolveChannel.ts` and `GET /api/channel` per section 5. Support all input formats: @handle, full URL (any of /@x, /channel/UC, /c/x, /user/x, with or without /videos), raw UC id, and plain name (with the search fallback). Reject non-YouTube hostnames. Then test with curl on at least 5 different inputs, including an invalid one and a malicious one like `https://evil.com` and `; rm -rf /`. Show me the outputs.

**Done when:** every valid format returns the same ChannelInfo shape and invalid ones return clean errors.

---

## Step 4: Videos endpoint
**Prompt:**
> Implement `services/videos.ts` and `GET /api/videos` per section 6: pagination (30 per page), tabs (videos/shorts), sort (latest/popular/oldest) using the approach that actually worked in Step 0, with the full-list fallback if needed. Build thumbnail URLs from the video id. Return `hasMore`. Cache results. Test: page 1, page 2, shorts tab, popular sort (confirm view counts are descending), oldest sort. Show curl outputs.

**Done when:** pagination has no duplicates and sorts are correct.

---

## Step 5: Download queue + progress
**Prompt:**
> Implement `services/queue.ts`, `POST /api/download`, `POST /api/download/batch`, `GET /api/progress/:jobId` (SSE) and `GET /api/file/:jobId` per sections 7 and 8. Use the exact yt-dlp args from the spec, parse the PROGRESS and FILEPATH lines, limit concurrency to MAX_CONCURRENT, dedupe duplicate requests, and add hourly cleanup plus graceful shutdown. Test with a short video of mine: start a job, watch the SSE stream with curl, then download the file and confirm it has sound and the highest resolution (use `ffprobe` to show resolution and audio stream). Also test a private/invalid video id and confirm a clean error.

**Done when:** the file plays with audio at the best available resolution and errors are clean.

---

## Step 6: Frontend shell with mock data
**Prompt:**
> Build the dark YouTube-style UI in `web/` using mock data first: SearchBar, ChannelHeader, Tabs, SortChips, VideoGrid, VideoCard (thumbnail, duration badge, 2-line title, views, hover download icon), Skeleton loaders, Toast. Responsive grid 3/2/1 columns. Match the colors in CLAUDE.md. Include empty and error states. Do not call the backend yet.

**Done when:** it looks close to a YouTube channel page on desktop and mobile widths.

---

## Step 7: Connect frontend to the API
**Prompt:**
> Create `lib/api.ts` and hooks `useChannel`, `useVideos`. Wire SearchBar -> /api/channel -> header, then videos grid. Tabs and sort chips reset the list and refetch. Add infinite scroll with IntersectionObserver and de-duplicate by id. Handle all error codes with friendly toasts. Add `format.ts` for durations (1:02:03) and views (1.2M).

**Done when:** entering a real channel shows real videos, tabs/sort/scroll all work.

---

## Step 8: Downloads in the UI
**Prompt:**
> Implement `useDownload`: click card -> POST /api/download -> EventSource on /api/progress/:jobId -> update the card overlay (Queued, Downloading %, Merging, Done, Failed with Retry). On done, trigger the browser download via a hidden anchor to /api/file/:jobId. Keep per-card state in a top-level Map keyed by video id so it survives tab switches. Prevent double-clicks, close EventSource on finish/unmount, and handle SSE disconnects.

**Done when:** clicking a video downloads the file automatically with live progress.

---

## Step 9: Select mode + bulk download
**Prompt:**
> Add select mode: checkbox on each card, a sticky SelectionBar ("N selected | Download selected | Clear"), "Select all loaded" button. "Download selected" calls /api/download/batch (max 50) and attaches progress to each card. Respect the server queue (3 at a time).

**Done when:** selecting 5 videos downloads all of them with correct per-card progress.

---

## Step 10: Hardening + review
**Prompt:**
> Do a full review against docs/02_TECH_SPEC.md sections 9 and 13. Check: no shell usage anywhere, `--` before URLs, videoId regex, path traversal protection on /api/file, rate limits, CORS, body limit, cleanup of listeners and child processes, all edge cases listed. Run `typecheck` and tests on both apps. List any gaps and fix them. Then write a README.md with setup, env vars, run commands, and troubleshooting (yt-dlp outdated, ffmpeg missing, 403 errors, age-restricted videos).

**Done when:** all checks pass and README is complete.

---

## Fix-it prompts (use when something breaks)
- **Download fails suddenly:** "Run `yt-dlp -U`, then run the exact yt-dlp command from the queue manually in the terminal and show me the full stderr. Fix the cause."
- **Wrong sort order:** "Log the first 10 view counts for sort=popular. Show them, then fix the sorting logic."
- **Progress stuck at 0%:** "Print raw stdout lines from yt-dlp during a download and fix the PROGRESS parser to match them."
- **UI bug:** "Describe what you see vs expected, reproduce it, fix only the affected component, don't touch other files."
- **General:** "Before changing code, explain the root cause in 2 lines. Then fix and run the test again."
