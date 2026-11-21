'use client';

interface SelectionBarProps {
  count: number;
  onDownloadSelected: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export function SelectionBar({ count, onDownloadSelected, onSelectAll, onClear }: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: '#1a1a1a',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      /* Safe area inset for iPhone home indicator */
      padding: '10px max(12px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      justifyContent: 'center',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
    }}>
      <span style={{ color: '#f1f1f1', fontWeight: 600, fontSize: 13 }}>
        {count} selected
      </span>
      <button
        onClick={onDownloadSelected}
        style={{
          backgroundColor: '#ff0000', color: 'white', border: 'none',
          borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          minHeight: 40,
        }}
      >
        ⬇ Download {count}
      </button>
      <button
        onClick={onSelectAll}
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)', color: '#f1f1f1', border: 'none',
          borderRadius: 20, padding: '8px 14px', fontSize: 12, cursor: 'pointer',
          minHeight: 40,
        }}
      >
        Select all
      </button>
      <button
        onClick={onClear}
        style={{
          background: 'none', color: '#aaa', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '8px 14px', fontSize: 12, cursor: 'pointer',
          minHeight: 40,
        }}
      >
        Clear
      </button>
    </div>
  );
}
