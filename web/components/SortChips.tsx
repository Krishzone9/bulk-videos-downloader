'use client';

import type { Sort } from '@/lib/types';

interface SortChipsProps {
  activeSort: Sort;
  onSortChange: (sort: Sort) => void;
}

const SORTS: { label: string; value: Sort }[] = [
  { label: 'Latest', value: 'latest' },
  { label: 'Popular', value: 'popular' },
  { label: 'Oldest', value: 'oldest' },
];

export function SortChips({ activeSort, onSortChange }: SortChipsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {SORTS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onSortChange(value)}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.15s',
            backgroundColor: activeSort === value ? '#ff0000' : 'rgba(255,255,255,0.08)',
            color: activeSort === value ? 'white' : '#aaa',
            // 44px minimum touch target
            minHeight: 36,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
