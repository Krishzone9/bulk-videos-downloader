# Project Rules (AI editor: follow these on every task)

## Project
YouTube Channel Bulk Downloader. Monorepo: `server/` (Node + Express + TypeScript) and `web/` (Next.js App Router + TypeScript + Tailwind). Full details in `docs/01_PRD.md` and `docs/02_TECH_SPEC.md`. These two files are the source of truth. If something is unclear, ask instead of guessing.

## Always
- TypeScript strict mode. No `any` (use `unknown` + narrowing).
- Validate every input with zod on the server.
- Use `child_process.spawn` with an args array. NEVER `exec` or shell strings. Put `--` before user-supplied URLs.
- Keep shared types identical in `server/src/types.ts` and `web/lib/types.ts`.
- Small files, one responsibility each. Follow the folder structure in the spec.
- Every API error uses the shape `{ error: { code, message } }`.
- Handle loading, empty and error states in every UI component.
- Clean up: remove listeners, close EventSource, kill child processes.
- Comment only the "why", not the "what".

## Never
- Never add libraries not in the spec without asking.
- Never store files outside `DOWNLOAD_DIR`.
- Never build file paths from user input.
- Never log full user input or cookies.
- Never rewrite working files when making a small change. Edit only what is needed.
- Never skip a step in the build prompts or say "this should work" without running it.

## Workflow per task
1. Restate the task in one line.
2. List the files you will create or change.
3. Implement.
4. Run the code (type-check, dev server, curl the endpoint) and show the result.
5. Fix errors yourself before reporting done.
6. Summarize what changed and what to test next, in 5 lines max.

## Commands
- Server: `cd server && npm run dev` (port 4000), `npm run typecheck`
- Web: `cd web && npm run dev` (port 3000), `npm run typecheck`
- Test engine: `yt-dlp --version`, `ffmpeg -version`

## Style
- Prettier defaults, 2 spaces, single quotes, semicolons.
- Tailwind only, no custom CSS except globals.
- Dark theme colors: bg #0f0f0f, text #f1f1f1, muted #aaa, accent #ff0000.
