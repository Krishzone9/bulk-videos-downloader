import type { ChannelInfo } from '../types.js';
import { runJson } from './ytdlp.js';
import { TtlCache } from './cache.js';
import { AppError, ErrorCode } from '../lib/errors.js';
import { config } from '../config.js';

const cache = new TtlCache<ChannelInfo>();
const CACHE_TTL = 30 * 60 * 1000;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);

/**
 * Resolve an arbitrary user input (URL, handle, channel ID, or name)
 * to a ChannelInfo object.
 */
export async function resolveChannel(input: string): Promise<ChannelInfo> {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 200) {
    throw new AppError(ErrorCode.INVALID_INPUT, 'Channel query is invalid.');
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = normalizeToUrl(trimmed);
  const channelUrl = stripTrailingSegments(url);

  // Try fetching channel info. If it fails for a plain name, fall back to search.
  let info: ChannelInfo;
  try {
    info = await fetchChannelInfo(`${channelUrl}/videos`);
  } catch (err) {
    // Only fall back to search if the input was a plain name (not URL/handle/ID)
    if (!trimmed.startsWith('http') && !trimmed.startsWith('@') && !(trimmed.startsWith('UC') && trimmed.length === 24)) {
      info = await searchAndFetchChannel(trimmed);
    } else {
      throw err;
    }
  }

  cache.set(cacheKey, info, CACHE_TTL);
  return info;
}

function normalizeToUrl(input: string): string {
  if (input.startsWith('http')) {
    let parsed: URL;
    try {
      parsed = new URL(input);
    } catch {
      throw new AppError(ErrorCode.INVALID_INPUT, 'Invalid URL format.');
    }
    if (!YOUTUBE_HOSTS.has(parsed.hostname)) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        'URL must be a YouTube domain.',
      );
    }
    return `https://www.youtube.com${parsed.pathname}`;
  }

  if (input.startsWith('@')) {
    return `https://www.youtube.com/${input}`;
  }

  // Raw channel ID (UC + 22 chars = 24 total)
  if (input.startsWith('UC') && input.length === 24) {
    return `https://www.youtube.com/channel/${input}`;
  }

  // Plain name: try as handle
  return `https://www.youtube.com/@${input.replace(/\s+/g, '')}`;
}

async function searchAndFetchChannel(name: string): Promise<ChannelInfo> {
  const args = buildBaseArgs([
    '--flat-playlist',
    '-J',
    '--playlist-items',
    '1',
  ]);
  args.push('--', `ytsearch1:${name}`);

  const data = await runJson(args);
  const entries = getEntries(data);
  const first = entries[0];

  if (!first) {
    throw new AppError(ErrorCode.CHANNEL_NOT_FOUND, 'No channel found for this search.');
  }

  const channelId = getStr(first, 'channel_id');
  if (!channelId) {
    throw new AppError(ErrorCode.CHANNEL_NOT_FOUND, 'No channel found for this search.');
  }

  return fetchChannelInfo(`https://www.youtube.com/channel/${channelId}/videos`);
}

async function fetchChannelInfo(url: string): Promise<ChannelInfo> {
  const args = buildBaseArgs([
    '--flat-playlist',
    '-J',
    '--playlist-items',
    '1',
  ]);
  args.push('--', url);

  const data = await runJson(args);

  const channelId =
    getStr(data, 'channel_id') ?? getStr(data, 'id') ?? '';
  const channelName =
    getStr(data, 'channel') ?? getStr(data, 'uploader') ?? 'Unknown';
  const handle = getStr(data, 'uploader_id') ?? null;

  if (!channelId) {
    throw new AppError(ErrorCode.CHANNEL_NOT_FOUND, 'Channel not found.');
  }

  // Extract avatar from thumbnails array
  let avatar: string | null = null;
  if (isRecord(data)) {
    const thumbs = (data as Record<string, unknown>)['thumbnails'];
    if (Array.isArray(thumbs) && thumbs.length > 0) {
      // Prefer avatar_uncropped, else last thumbnail
      const avatarThumb = thumbs.find(
        (t) => isRecord(t) && (t as Record<string, unknown>)['id'] === 'avatar_uncropped',
      );
      const chosen = avatarThumb ?? thumbs[thumbs.length - 1];
      if (isRecord(chosen)) {
        const thumbUrl = (chosen as Record<string, unknown>)['url'];
        if (typeof thumbUrl === 'string') avatar = thumbUrl;
      }
    }
  }

  return {
    id: channelId,
    name: channelName,
    handle,
    avatar,
    url: `https://www.youtube.com/channel/${channelId}`,
  };
}

function buildBaseArgs(extra: string[]): string[] {
  const args = [...extra, '--no-warnings'];
  if (config.YTDLP_COOKIES_FROM_BROWSER) {
    args.push('--cookies-from-browser', config.YTDLP_COOKIES_FROM_BROWSER);
  }
  return args;
}

function stripTrailingSegments(url: string): string {
  return url.replace(/\/(videos|shorts|featured)\/?$/, '');
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

function getEntries(data: unknown): unknown[] {
  if (!isRecord(data)) return [];
  const entries = (data as Record<string, unknown>)['entries'];
  return Array.isArray(entries) ? entries : [];
}
