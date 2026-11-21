'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Job } from '@/lib/types';
import * as api from '@/lib/api';

type DownloadStateMap = Map<string, Job>;
type Listener = (map: DownloadStateMap) => void;

// Top-level Map keyed by videoId — survives re-renders and tab switches
const globalDownloadState: DownloadStateMap = new Map();
const listeners = new Set<Listener>();

function notifyListeners() {
  const snapshot = new Map(globalDownloadState);
  for (const l of listeners) l(snapshot);
}

function updateVideoState(videoId: string, patch: Partial<Job>) {
  const existing = globalDownloadState.get(videoId);
  if (!existing) return;
  globalDownloadState.set(videoId, { ...existing, ...patch });
  notifyListeners();
}

function setVideoState(videoId: string, job: Job) {
  globalDownloadState.set(videoId, job);
  notifyListeners();
}

export function useDownload(
  onStateChange: (map: DownloadStateMap) => void,
) {
  const eventSources = useRef(new Map<string, EventSource>());
  const listenerRef = useRef(onStateChange);
  listenerRef.current = onStateChange;

  useEffect(() => {
    const l: Listener = (map) => listenerRef.current(map);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Clean up all EventSources on unmount
  useEffect(() => {
    const sources = eventSources.current;
    return () => {
      for (const es of sources.values()) es.close();
      sources.clear();
    };
  }, []);

  const openProgressStream = useCallback(
    (videoId: string, jobId: string) => {
      // Close any existing stream for this video
      eventSources.current.get(videoId)?.close();

      const es = new EventSource(api.getProgressUrl(jobId));
      eventSources.current.set(videoId, es);

      es.onmessage = (event: MessageEvent) => {
        try {
          const job = JSON.parse(event.data as string) as Job;
          setVideoState(videoId, job);

          if (job.status === 'done') {
            // Trigger browser download via hidden anchor
            const a = document.createElement('a');
            a.href = api.getFileUrl(jobId);
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            es.close();
            eventSources.current.delete(videoId);
          } else if (job.status === 'failed') {
            es.close();
            eventSources.current.delete(videoId);
          }
        } catch {
          // Ignore parse errors from heartbeats
        }
      };

      es.onerror = () => {
        const current = globalDownloadState.get(videoId);
        if (
          current &&
          current.status !== 'done' &&
          current.status !== 'failed'
        ) {
          updateVideoState(videoId, {
            status: 'failed',
            error: 'Connection lost. Please retry.',
          });
        }
        es.close();
        eventSources.current.delete(videoId);
      };
    },
    [],
  );

  const startDownload = useCallback(
    async (videoId: string, isShort = false) => {
      const existing = globalDownloadState.get(videoId);
      // Prevent double-start
      if (
        existing &&
        (existing.status === 'queued' ||
          existing.status === 'downloading' ||
          existing.status === 'merging')
      ) {
        return;
      }

      // Optimistic queued state
      setVideoState(videoId, {
        jobId: '',
        videoId,
        status: 'queued',
        percent: 0,
        speed: null,
        eta: null,
        fileName: null,
        error: null,
        createdAt: Date.now(),
      });

      try {
        const { jobId } = await api.startDownload(videoId, isShort);
        updateVideoState(videoId, { jobId });
        openProgressStream(videoId, jobId);
      } catch (err) {
        updateVideoState(videoId, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Download failed.',
        });
      }
    },
    [openProgressStream],
  );

  const startBatchDownload = useCallback(
    async (videoIds: string[], isShort = false) => {
      // Optimistic queued state for all
      for (const videoId of videoIds) {
        const existing = globalDownloadState.get(videoId);
        if (
          existing &&
          (existing.status === 'queued' ||
            existing.status === 'downloading' ||
            existing.status === 'merging')
        ) {
          continue;
        }
        setVideoState(videoId, {
          jobId: '',
          videoId,
          status: 'queued',
          percent: 0,
          speed: null,
          eta: null,
          fileName: null,
          error: null,
          createdAt: Date.now(),
        });
      }

      try {
        const { jobIds } = await api.startBatchDownload(videoIds, isShort);
        for (let i = 0; i < videoIds.length; i++) {
          const videoId = videoIds[i];
          const jobId = jobIds[i];
          if (!videoId || !jobId) continue;
          updateVideoState(videoId, { jobId });
          openProgressStream(videoId, jobId);
        }
      } catch (err) {
        for (const videoId of videoIds) {
          updateVideoState(videoId, {
            status: 'failed',
            error: err instanceof Error ? err.message : 'Batch download failed.',
          });
        }
      }
    },
    [openProgressStream],
  );

  const retryDownload = useCallback(
    async (videoId: string, isShort = false) => {
      globalDownloadState.delete(videoId);
      notifyListeners();
      await startDownload(videoId, isShort);
    },
    [startDownload],
  );

  return { startDownload, startBatchDownload, retryDownload };
}
