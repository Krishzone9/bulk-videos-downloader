export type Tab = 'videos' | 'shorts';
export type Sort = 'latest' | 'popular' | 'oldest';

export interface ChannelInfo {
  id: string;
  name: string;
  handle: string | null;
  avatar: string | null;
  url: string;
}

export interface VideoItem {
  id: string;
  title: string;
  durationSec: number | null;
  viewCount: number | null;
  thumbnail: string;
  publishedText: string | null;
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
  percent: number;
  speed: string | null;
  eta: string | null;
  fileName: string | null;
  error: string | null;
  createdAt: number;
}
