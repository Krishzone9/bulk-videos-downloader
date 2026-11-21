# PRD: YouTube Channel Bulk Downloader

## 1. Summary
A local web app. User enters a channel name, @handle or link. The app lists all videos in a YouTube-style grid. Clicking a video downloads it in the highest available quality (video + audio merged to MP4).

## 2. Goals
- Channel videos listed in under 5 seconds (first page)
- One click = best quality download
- UI feels like YouTube's channel page (dark theme)

## 3. Non-goals (v1)
Accounts, payments, cloud hosting, mobile app, downloading private videos.

## 4. User story
"As a creator, I paste my channel link, see all my videos, and click one to save it at 4K/1080p without opening other tools."

## 5. Features

| ID | Feature | Acceptance criteria |
|----|---------|---------------------|
| F1 | Channel input | Accepts `@handle`, `youtube.com/@x`, `youtube.com/channel/UC...`, `youtube.com/c/x`, `youtube.com/user/x`, or plain name |
| F2 | Channel header | Avatar, name, handle shown after fetch |
| F3 | Tabs | Videos / Shorts |
| F4 | Sort chips | Latest / Popular / Oldest |
| F5 | Video grid | 3 columns desktop, 2 tablet, 1 mobile. Card: thumbnail, duration badge, title, views |
| F6 | Infinite scroll | 30 videos per page, loads on scroll end |
| F7 | Click to download | Click card or download button starts job, no page reload |
| F8 | Progress | Card overlay: Queued, Downloading %, Merging, Done, Failed (+ Retry) |
| F9 | File delivery | When done, browser saves the file automatically |
| F10 | Select mode | Checkbox on cards, "Download selected (N)" button, runs through queue |
| F11 | Errors | Friendly toast for invalid channel, private/age-restricted/removed video, network failure |

## 6. Nice-to-have (v2)
Quality dropdown, audio-only MP3, search inside channel, download history, subtitles, Docker.

## 7. UI spec
- Background `#0f0f0f`, card text `#f1f1f1`, secondary `#aaa`, accent red `#ff0000`
- Top bar: input (placeholder "Channel name or link") + Fetch button
- Below: channel header, tabs, chips, grid
- Card: 16:9 thumbnail, rounded 12px, duration badge bottom-right, hover shows download icon, active download shows progress bar at bottom of thumbnail
- Empty state, loading skeletons, error state all designed

## 8. Success metrics
- 95% of public videos download at max available resolution
- Zero crashes on 3 different test channels (small, large 1000+ videos, Shorts-heavy)
- No shell injection possible through any input
