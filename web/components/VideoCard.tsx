'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { VideoItem, Job } from '@/lib/types';
import { formatDuration, formatViews, formatPublished } from '@/lib/format';

interface VideoCardProps {
  video: VideoItem;
  downloadState: Job | null;
  selected: boolean;
  selectMode: boolean;
  onDownload: (videoId: string) => void;
  onSelect: (videoId: string) => void;
  onRetry: (videoId: string) => void;
}

export function VideoCard({
  video, downloadState, selected, selectMode, onDownload, onSelect, onRetry,
}: VideoCardProps) {
  const [hovered, setHovered] = useState(false);
  const status = downloadState?.status ?? null;
  const percent = downloadState?.percent ?? 0;

  function handleClick() {
    if (selectMode) onSelect(video.id);
    else if (!status || status === 'failed') onDownload(video.id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
  }

  // Show download overlay on hover (desktop) or always on touch when idle
  const showDownloadHint = !selectMode && !status && hovered;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Download ${video.title}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: hovered ? '#1f1f1f' : '#161616',
        transition: 'background-color 0.15s, transform 0.1s',
        outline: 'none',
        // Hardware acceleration for smooth scroll
        willChange: 'transform',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {/* Thumbnail container */}
      <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#111', overflow: 'hidden' }}>
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          style={{ objectFit: 'cover' }}
          unoptimized
        />

        {/* Duration badge */}
        {video.durationSec !== null && video.durationSec > 0 && (
          <span style={{
            position: 'absolute', bottom: 6, right: 6,
            backgroundColor: 'rgba(0,0,0,0.85)', color: 'white',
            fontSize: 11, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
          }}>
            {formatDuration(video.durationSec)}
          </span>
        )}

        {/* Hover download overlay (desktop) */}
        {showDownloadHint && (
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: 'rgba(255,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </div>
          </div>
        )}

        {/* On touch devices: show a subtle download icon when idle */}
        {!selectMode && !status && !hovered && (
          <div
            className="touch-download-hint"
            style={{
              position: 'absolute', bottom: 6, left: 6,
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'none', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" width="14" height="14" opacity={0.8}>
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </div>
        )}

        {/* Select checkbox */}
        {selectMode && (
          <div
            onClick={e => { e.stopPropagation(); onSelect(video.id); }}
            style={{ position: 'absolute', top: 6, left: 6, padding: 4 }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 4,
              backgroundColor: selected ? '#ff0000' : 'rgba(0,0,0,0.6)',
              border: selected ? 'none' : '2px solid rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected && (
                <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Queued */}
        {status === 'queued' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#aaa', fontSize: 13, fontWeight: 600 }}>⏳ Queued</span>
          </div>
        )}

        {/* Downloading with progress */}
        {status === 'downloading' && (
          <>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{Math.min(percent, 99)}%</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <div style={{ height: '100%', backgroundColor: '#ff0000', width: `${Math.min(percent, 99)}%`, transition: 'width 0.4s ease' }} />
            </div>
          </>
        )}

        {/* Merging */}
        {status === 'merging' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>⚙️ Merging…</span>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <span style={{ color: '#f87171', fontSize: 12, fontWeight: 600 }}>❌ Failed</span>
            <button
              onClick={() => onRetry(video.id)}
              style={{
                backgroundColor: '#ff0000', color: 'white', border: 'none',
                borderRadius: 16, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                minHeight: 32,
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Card info */}
      <div style={{ padding: '6px 8px 8px' }}>
        <p
          title={video.title}
          style={{
            margin: 0, fontSize: 12, fontWeight: 500, color: '#f1f1f1', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {video.title}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#aaa' }}>
          {formatViews(video.viewCount)}
          {video.publishedText ? ` · ${formatPublished(video.publishedText)}` : ''}
        </p>
      </div>
    </div>
  );
}
