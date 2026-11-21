'use client';

import { useState, useCallback, useRef } from 'react';
import type { ChannelInfo } from '@/lib/types';
import * as api from '@/lib/api';

interface UseChannelState {
  channel: ChannelInfo | null;
  loading: boolean;
  error: string | null;
}

export function useChannel() {
  const [state, setState] = useState<UseChannelState>({
    channel: null,
    loading: false,
    error: null,
  });
  // Prevent stale responses from overwriting fresh ones
  const requestId = useRef(0);

  const fetchChannel = useCallback(async (query: string) => {
    if (!query.trim()) return;
    const thisRequest = ++requestId.current;
    setState({ channel: null, loading: true, error: null });
    try {
      const info = await api.fetchChannel(query);
      // Only update if this is still the latest request
      if (thisRequest !== requestId.current) return;
      setState({ channel: info, loading: false, error: null });
    } catch (err) {
      if (thisRequest !== requestId.current) return;
      const message =
        err instanceof Error ? err.message : 'Failed to load channel.';
      setState({ channel: null, loading: false, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    requestId.current++;
    setState({ channel: null, loading: false, error: null });
  }, []);

  return { ...state, fetchChannel, reset };
}
