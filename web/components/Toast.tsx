'use client';

import { useEffect, useRef } from 'react';

interface ToastProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  onDismiss: () => void;
}

const BG: Record<string, string> = {
  error: '#dc2626',
  success: '#16a34a',
  info: '#2563eb',
};

export function Toast({ message, type = 'error', onDismiss }: ToastProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    timer.current = setTimeout(onDismiss, 5000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        /* On mobile: full-width at top; on desktop: bottom-right corner */
        bottom: 'env(safe-area-inset-bottom, 16px)',
        left: 12, right: 12,
        zIndex: 100,
        backgroundColor: BG[type] ?? BG.error,
        color: 'white', borderRadius: 10,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontSize: 14, fontWeight: 500,
        maxWidth: 400,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)',
          cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4,
          minWidth: 32, minHeight: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  );
}
