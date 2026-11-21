'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VideoItem, Tab, Sort } from '@/lib/types';
import * as api from '@/lib/api';

export function useVideos(channelId: string | null, tab: Tab, sort: Sort) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const seenIds = useRef(new Set<string>());
  // Abort controller to cancel in-flight requests on param change
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setVideos([]);
    setHasMore(false);
    setError(null);
    pageRef.current = 1;
    seenIds.current = new Set();
  }, []);

  // Fetch page 1 whenever channelId, tab, or sort changes
  useEffect(() => {
    if (!channelId) {
      reset();
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setVideos([]);
    setHasMore(false);
    setError(null);
    pageRef.current = 1;
    seenIds.current = new Set();

    api
      .fetchVideos({ channel: channelId, tab, sort, page: 1 })
      .then((page) => {
        if (controller.signal.aborted) return;
        const unique = page.items.filter((v) => {
          if (seenIds.current.has(v.id)) return false;
          seenIds.current.add(v.id);
          return true;
        });
        setVideos(unique);
        setHasMore(page.hasMore);
        pageRef.current = 2;
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load videos.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [channelId, tab, sort, reset]);

  const loadMore = useCallback(async () => {
    if (!channelId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await api.fetchVideos({
        channel: channelId,
        tab,
        sort,
        page: pageRef.current,
      });
      const unique = page.items.filter((v) => {
        if (seenIds.current.has(v.id)) return false;
        seenIds.current.add(v.id);
        return true;
      });
      setVideos((prev) => [...prev, ...unique]);
      setHasMore(page.hasMore);
      pageRef.current++;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load more videos.',
      );
    } finally {
      setLoadingMore(false);
    }
  }, [channelId, tab, sort, loadingMore, hasMore]);

  return { videos, loading, loadingMore, hasMore, error, loadMore };
}
