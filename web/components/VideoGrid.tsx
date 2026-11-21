'use client';

import { type Ref } from 'react';
import type { VideoItem, Job } from '@/lib/types';
import { VideoCard } from './VideoCard';
import { SkeletonGrid } from './Skeleton';

interface VideoGridProps {
  videos: VideoItem[];
  downloadStates: Map<string, Job>;
  selectedIds: Set<string>;
  selectMode: boolean;
  loading: boolean;
  loadingMore: boolean;
  sentinelRef: Ref<HTMLDivElement>;
  onDownload: (videoId: string) => void;
  onSelect: (videoId: string) => void;
  onRetry: (videoId: string) => void;
}

/**
 * Responsive grid:
 * - ≤ 480px (phones): 2 columns (minmax 140px)
 * - 481–768px (large phones / small tablets): 3 columns
 * - 769–1024px (tablets): 4 columns
 * - > 1024px (desktop): auto-fill from 200px
 *
 * Uses CSS clamp-based minmax for a single grid definition that
 * works across all sizes. The 140px min lets 2 cards fit on a
 * 320px-wide phone with 12px gap + 24px padding.
 */
const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
  gap: 10,
};

export function VideoGrid({
  videos, downloadStates, selectedIds, selectMode,
  loading, loadingMore, sentinelRef, onDownload, onSelect, onRetry,
}: VideoGridProps) {
  if (loading) return <SkeletonGrid />;

  if (videos.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', color: '#aaa', textAlign: 'center' }}>
        <p style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>No videos found</p>
        <p style={{ fontSize: 14, margin: '8px 0 0' }}>Try a different tab or sort order.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={GRID_STYLE}>
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            downloadState={downloadStates.get(video.id) ?? null}
            selected={selectedIds.has(video.id)}
            selectMode={selectMode}
            onDownload={onDownload}
            onSelect={onSelect}
            onRetry={onRetry}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {loadingMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>Loading more…</span>
        </div>
      )}
    </div>
  );
}
