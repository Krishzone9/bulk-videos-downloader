import type { ChannelInfo, VideosPage, Job } from './types';

const API_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

interface ApiError {
  error: { code: string; message: string };
}

function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiError).error?.code === 'string'
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const data: unknown = await res.json();
  if (!res.ok) {
    if (isApiError(data)) {
      throw Object.assign(new Error(data.error.message), {
        code: data.error.code,
      });
    }
    throw new Error(`HTTP ${res.status}`);
  }
  return data as T;
}

export async function fetchChannel(query: string): Promise<ChannelInfo> {
  return request<ChannelInfo>(
    `/api/channel?q=${encodeURIComponent(query)}`,
  );
}

export async function fetchVideos(params: {
  channel: string;
  tab?: string;
  sort?: string;
  page?: number;
}): Promise<VideosPage> {
  const qs = new URLSearchParams({
    channel: params.channel,
    ...(params.tab ? { tab: params.tab } : {}),
    ...(params.sort ? { sort: params.sort } : {}),
    ...(params.page !== undefined ? { page: String(params.page) } : {}),
  });
  return request<VideosPage>(`/api/videos?${qs.toString()}`);
}

export async function startDownload(
  videoId: string,
  isShort = false,
): Promise<{ jobId: string }> {
  return request<{ jobId: string }>('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, isShort }),
  });
}

export async function startBatchDownload(
  videoIds: string[],
  isShort = false,
): Promise<{ jobIds: string[] }> {
  return request<{ jobIds: string[] }>('/api/download/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds, isShort }),
  });
}

export function getProgressUrl(jobId: string): string {
  return `${API_URL}/api/progress/${jobId}`;
}

export function getFileUrl(jobId: string): string {
  return `${API_URL}/api/file/${jobId}`;
}

export type { Job };
