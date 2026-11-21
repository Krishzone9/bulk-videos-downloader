# Test Checklist

## Test channels
- Small channel (under 50 videos)
- Large channel (1000+ videos)
- Shorts-heavy channel
- Channel with no Shorts tab

## Input formats (all should work)
- [ ] `@handle`
- [ ] `https://www.youtube.com/@handle`
- [ ] `https://www.youtube.com/@handle/videos`
- [ ] `https://www.youtube.com/channel/UC...`
- [ ] `https://www.youtube.com/c/name`
- [ ] plain channel name
- [ ] invalid text -> clean error
- [ ] `https://evil.com/x` -> rejected
- [ ] `; rm -rf /` -> rejected, no command runs

## Listing
- [ ] First page under 5 seconds
- [ ] Infinite scroll adds 30 each time, no duplicates
- [ ] Videos / Shorts tabs both work
- [ ] Latest / Popular / Oldest order is correct
- [ ] Durations and view counts formatted right

## Download
- [ ] Single click starts one job (double-click does not create two)
- [ ] Progress moves, then Merging, then Done
- [ ] Browser auto-saves the file
- [ ] `ffprobe` shows highest resolution and an audio stream
- [ ] Private / removed video -> friendly error + Retry
- [ ] Age-restricted video -> clear message
- [ ] 5 selected videos -> only 3 download at once, rest queued
- [ ] Server restart -> UI shows failed + Retry, no crash

## Security
- [ ] `/api/file/../../secret` returns 404
- [ ] No `exec` or shell string anywhere (search codebase)
- [ ] CORS blocks other origins
- [ ] Rate limit triggers after many requests

## Quality gates
- [ ] `npm run typecheck` passes in server and web
- [ ] No `any` in code
- [ ] No console errors in browser
- [ ] Lighthouse accessibility above 90
