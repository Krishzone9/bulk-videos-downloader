'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Tab, Sort, Job } from '@/lib/types';
import { SearchBar } from '@/components/SearchBar';
import { ChannelHeader } from '@/components/ChannelHeader';
import { Tabs } from '@/components/Tabs';
import { SortChips } from '@/components/SortChips';
import { VideoGrid } from '@/components/VideoGrid';
import { SelectionBar } from '@/components/SelectionBar';
import { Toast } from '@/components/Toast';
import { useChannel } from '@/hooks/useChannel';
import { useVideos } from '@/hooks/useVideos';
import { useDownload } from '@/hooks/useDownload';

export default function Home() {
  const [tab, setTab] = useState<Tab>('videos');
  const [sort, setSort] = useState<Sort>('latest');
  const [toast, setToast] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadStates, setDownloadStates] = useState<Map<string, Job>>(new Map());

  const { channel, loading: channelLoading, error: channelError, fetchChannel, reset: resetChannel } = useChannel();
  const { videos, loading, loadingMore, hasMore, error: videosError, loadMore } =
    useVideos(channel?.id ?? null, tab, sort);
  const { startDownload, startBatchDownload, retryDownload } = useDownload(setDownloadStates);

  useEffect(() => { if (channelError) setToast(channelError); }, [channelError]);
  useEffect(() => { if (videosError) setToast(videosError); }, [videosError]);

  // Reset selections on channel/tab/sort change
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [channel?.id, tab, sort]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting && hasMore && !loadingMore) void loadMore(); },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const handleDownload = useCallback((id: string) => {
    const video = videos.find(v => v.id === id);
    void startDownload(id, video?.isShort ?? false);
  }, [startDownload, videos]);
  const handleRetry = useCallback((id: string) => {
    void retryDownload(id, videos.find(v => v.id === id)?.isShort ?? false);
  }, [retryDownload, videos]);

  function handleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSelectMode(true);
  }

  function handleTabChange(t: Tab) { setTab(t); setSort('latest'); }
  function handleDownloadSelected() {
    if (!selectedIds.size) return;
    void startBatchDownload([...selectedIds], tab === 'shorts');
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  function handleGoHome() {
    resetChannel();
    setTab('videos');
    setSort('latest');
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f0f0f' }}>
      {/* Top nav bar — with safe area padding for notched phones */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: '#0f0f0f',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px max(12px, env(safe-area-inset-right)) 10px max(12px, env(safe-area-inset-left))',
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {/* Logo — clickable, returns to home */}
        <button
          onClick={handleGoHome}
          aria-label="Go to homepage"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#ff0000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              {/* Play triangle with download arrow */}
              <path d="M8 5v14l11-7L8 5z"/>
              <rect x="2" y="18" width="6" height="1.5" rx="0.75" fill="white" opacity="0.8"/>
              <path d="M5 14v3" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.8"/>
              <path d="M3.5 15.5 L5 17 L6.5 15.5" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            </svg>
          </div>
          <span className="brand-text" style={{ fontSize: 15, fontWeight: 700, color: '#f1f1f1', letterSpacing: '-0.3px' }}>
            YT Downloader
          </span>
        </button>

        {/* Search bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchBar onSearch={fetchChannel} loading={channelLoading} />
        </div>
      </header>

      <main style={{
        flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%',
        padding: '0 max(12px, env(safe-area-inset-right)) 80px max(12px, env(safe-area-inset-left))',
      }}>
        {channel ? (
          <>
            {/* Channel header */}
            <div style={{ padding: '20px 0 16px' }}>
              <ChannelHeader channel={channel} />
            </div>

            {/* Tabs */}
            <Tabs activeTab={tab} onTabChange={handleTabChange} />

            {/* Sort + select toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexWrap: 'wrap', gap: 8 }}>
              <SortChips activeSort={sort} onSortChange={setSort} />
              {videos.length > 0 && (
                <button
                  onClick={() => { setSelectMode(m => !m); setSelectedIds(new Set()); }}
                  style={{
                    background: selectMode ? 'rgba(255,255,255,0.12)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f1f1f1', borderRadius: 20,
                    padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                    transition: 'background 0.15s',
                    // Bigger touch target on mobile
                    minHeight: 40,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {selectMode ? '✕ Cancel' : '☑ Select'}
                </button>
              )}
            </div>

            {/* Video grid */}
            <VideoGrid
              videos={videos}
              downloadStates={downloadStates}
              selectedIds={selectedIds}
              selectMode={selectMode}
              loading={loading}
              loadingMore={loadingMore}
              sentinelRef={sentinelRef}
              onDownload={handleDownload}
              onSelect={handleSelect}
              onRetry={handleRetry}
            />
          </>
        ) : (
          /* Hero / idle state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '70dvh',
            textAlign: 'center', gap: 16, padding: '24px 16px',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              backgroundColor: 'rgba(255,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <svg viewBox="0 0 24 24" fill="#ff0000" width="36" height="36">
                <path d="M8 5v14l11-7L8 5z"/>
                <rect x="2" y="18" width="6" height="1.5" rx="0.75" fill="#ff0000" opacity="0.7"/>
                <path d="M5 14v3" stroke="#ff0000" strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
                <path d="M3.5 15.5 L5 17 L6.5 15.5" stroke="#ff0000" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 700, color: '#f1f1f1', margin: 0 }}>
              YouTube Bulk Downloader
            </h1>
            <p style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#aaa', margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
              Enter a channel handle, URL, or name above to browse and download videos at the highest quality.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['@MrBeast', 'youtube.com/@NASA', 'Veritasium'].map(ex => (
                <button
                  key={ex}
                  onClick={() => fetchChannel(ex)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#aaa', borderRadius: 20, padding: '8px 16px',
                    fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                    minHeight: 40,
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = '#f1f1f1'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = '#aaa'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bulk selection bar */}
      {selectMode && selectedIds.size > 0 && (
        <SelectionBar
          count={selectedIds.size}
          onDownloadSelected={handleDownloadSelected}
          onSelectAll={() => setSelectedIds(new Set(videos.map(v => v.id)))}
          onClear={() => { setSelectedIds(new Set()); setSelectMode(false); }}
        />
      )}

      <Toast message={toast} type="error" onDismiss={() => setToast(null)} />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, flexWrap: 'wrap',
        marginTop: 'auto',
      }}>
        <span style={{ fontSize: 12, color: '#666' }}>
          © {new Date().getFullYear()} YT Bulk Downloader
        </span>
        <Link href="/about" style={{ fontSize: 12, color: '#aaa', textDecoration: 'none' }}>
          About
        </Link>
        <Link href="/privacy" style={{ fontSize: 12, color: '#aaa', textDecoration: 'none' }}>
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
