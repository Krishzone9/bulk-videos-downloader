import type { VideoItem, VideosPage, Tab, Sort } from '../types.js';
import { runJson } from './ytdlp.js';
import { TtlCache } from './cache.js';
import { config } from '../config.js';

const pageCache = new TtlCache<VideosPage>();
const fullListCache = new TtlCache<VideoItem[]>();
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Fetch a page of videos from a channel tab with sorting.
 */
export async function fetchVideos(
  channelId: string,
  tab: Tab,
  sort: Sort,
  page: number,
): Promise<VideosPage> {
  const cacheKey = `${channelId}:${tab}:${sort}:${page}`;
  const cached = pageCache.get(cacheKey);
  if (cached) return cached;

  let result: VideosPage;

  if (sort === 'latest') {
    result = await fetchPage(channelId, tab, page);
  } else if (sort === 'popular') {
    result = await fetchPopularPage(channelId, tab, page);
  } else {
    result = await fetchOldestPage(channelId, tab, page);
  }

  pageCache.set(cacheKey, result, CACHE_TTL);
  return result;
}

async function fetchPage(
  channelId: string,
  tab: Tab,
  page: number,
  urlSuffix = '',
): Promise<VideosPage> {
  const pageSize = config.PAGE_SIZE;
  const start = (page - 1) * pageSize + 1;
  const end = page * pageSize;

  const url = `https://www.youtube.com/channel/${channelId}/${tab}${urlSuffix}`;
  const args = buildArgs(url, `${start}-${end}`);
  // Longer timeout for large channels
  const data = await runJson(args, 180_000);
  const entries = getEntries(data);
  const items = entries.map((e) => mapEntry(e, tab === 'shorts'));

  return {
    items,
    page,
    hasMore: items.length === pageSize,
  };
}

/**
 * Popular: use YouTube's ?view=0&sort=p URL param which yt-dlp passes through.
 * This lets us paginate directly without fetching all videos first —
 * critical for large channels like T-Series (20k+ videos).
 */
async function fetchPopularPage(
  channelId: string,
  tab: Tab,
  page: number,
): Promise<VideosPage> {
  const pageSize = config.PAGE_SIZE;
  const start = (page - 1) * pageSize + 1;
  const end = page * pageSize;

  const url = `https://www.youtube.com/channel/${channelId}/${tab}?view=0&sort=p`;
  const args = buildArgs(url, `${start}-${end}`);

  try {
    const data = await runJson(args, 180_000);
    const entries = getEntries(data);
    const items = entries.map((e) => mapEntry(e, tab === 'shorts'));

    // Verify sort actually worked: check if the first few items are
    // roughly in descending view-count order. If not, fall back.
    if (page === 1 && items.length >= 2) {
      const viewCounts = items
        .slice(0, 5)
        .map((v) => v.viewCount ?? 0);
      const isSorted = viewCounts.every(
        (v, i) => i === 0 || viewCounts[i - 1]! >= v * 0.5,
      );
      if (!isSorted) {
        // YouTube sort param didn't work, fall back to full-fetch
        return await fetchAllAndSort(channelId, tab, 'popular', page);
      }
    }

    return { items, page, hasMore: items.length === pageSize };
  } catch {
    // If the sort URL fails, fall back to full-fetch
    return await fetchAllAndSort(channelId, tab, 'popular', page);
  }
}

/**
 * Oldest: use YouTube's ?view=0&sort=da URL param.
 * Falls back to reversing the full list if the URL doesn't work.
 */
async function fetchOldestPage(
  channelId: string,
  tab: Tab,
  page: number,
): Promise<VideosPage> {
  const pageSize = config.PAGE_SIZE;
  const start = (page - 1) * pageSize + 1;
  const end = page * pageSize;

  const url = `https://www.youtube.com/channel/${channelId}/${tab}?view=0&sort=da`;
  const args = buildArgs(url, `${start}-${end}`);

  try {
    const data = await runJson(args, 180_000);
    const entries = getEntries(data);
    const items = entries.map((e) => mapEntry(e, tab === 'shorts'));

    return { items, page, hasMore: items.length === pageSize };
  } catch {
    // Fall back to full-fetch + reverse
    return await fetchAllAndSort(channelId, tab, 'oldest', page);
  }
}

/**
 * Fallback: fetch the full video list once, sort in-memory, then paginate.
 * Only used when YouTube sort URL params don't work.
 */
async function fetchAllAndSort(
  channelId: string,
  tab: Tab,
  sort: Sort,
  page: number,
): Promise<VideosPage> {
  const fullKey = `${channelId}:${tab}:full`;
  let items = fullListCache.get(fullKey);

  if (!items) {
    const url = `https://www.youtube.com/channel/${channelId}/${tab}`;
    const args = buildArgs(url);
    // No playlist-items = fetch everything; long timeout
    const data = await runJson(args, 300_000);
    const entries = getEntries(data);
    items = entries.map((e) => mapEntry(e, tab === 'shorts'));
    fullListCache.set(fullKey, items, CACHE_TTL);
  }

  // Sort a copy so the cache stays in original order
  const sorted = [...items];
  if (sort === 'popular') {
    sorted.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  } else if (sort === 'oldest') {
    const hasDate = sorted.some((v) => v.publishedText);
    if (hasDate) {
      sorted.sort((a, b) =>
        (a.publishedText ?? '').localeCompare(b.publishedText ?? ''),
      );
    } else {
      sorted.reverse();
    }
  }

  const pageSize = config.PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const sliced = sorted.slice(start, start + pageSize);

  return {
    items: sliced,
    page,
    hasMore: start + pageSize < sorted.length,
  };
}

function buildArgs(url: string, playlistItems?: string): string[] {
  const args = ['--flat-playlist', '-J', '--no-warnings'];

  if (playlistItems) {
    args.push('--playlist-items', playlistItems);
  }

  if (config.YTDLP_COOKIES_FROM_BROWSER) {
    args.push('--cookies-from-browser', config.YTDLP_COOKIES_FROM_BROWSER);
  }

  args.push('--', url);
  return args;
}

function mapEntry(entry: unknown, isShort: boolean): VideoItem {
  // yt-dlp flat-playlist: 'id' is sometimes the full URL, 'url' is the watch URL or just the ID
  const rawId = getStr(entry, 'id') ?? '';
  const rawUrl = getStr(entry, 'url') ?? '';

  // Extract the 11-char video ID
  const id = extractVideoId(rawId) ?? extractVideoId(rawUrl) ?? rawId;

  const title = getStr(entry, 'title') ?? 'Untitled';
  const duration = getNum(entry, 'duration');
  const viewCount = getNum(entry, 'view_count');
  const publishedText = getStr(entry, 'upload_date') ?? null;

  return {
    id,
    title,
    durationSec: duration,
    viewCount,
    thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    publishedText,
    isShort,
  };
}

/** Extract an 11-char YouTube video ID from a string (URL or raw ID). */
function extractVideoId(input: string): string | null {
  // Already an 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;

  // Try to parse from URL
  try {
    const url = new URL(input);
    const v = url.searchParams.get('v');
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

    // /shorts/ID or /watch/ID or /embed/ID
    const segments = url.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /^[A-Za-z0-9_-]{11}$/.test(last)) return last;
  } catch {
    // Not a URL, try regex on the raw string
    const match = /[A-Za-z0-9_-]{11}/.exec(input);
    if (match) return match[0];
  }

  return null;
}

// Narrow helpers for unknown JSON data
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getStr(data: unknown, key: string): string | undefined {
  if (!isRecord(data)) return undefined;
  const val = (data as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : undefined;
}

function getNum(data: unknown, key: string): number | null {
  if (!isRecord(data)) return null;
  const val = (data as Record<string, unknown>)[key];
  return typeof val === 'number' ? val : null;
}

function getEntries(data: unknown): unknown[] {
  if (!isRecord(data)) return [];
  const entries = (data as Record<string, unknown>)['entries'];
  return Array.isArray(entries) ? entries : [];
}
