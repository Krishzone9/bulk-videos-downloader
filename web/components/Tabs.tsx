'use client';

import type { Tab } from '@/lib/types';

interface TabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { label: string; value: Tab }[] = [
  { label: 'Videos', value: 'videos' },
  { label: 'Shorts', value: 'shorts' },
];

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }} role="tablist">
      {TABS.map(({ label, value }) => (
        <button
          key={value}
          role="tab"
          aria-selected={activeTab === value}
          onClick={() => onTabChange(value)}
          style={{
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 500,
            color: activeTab === value ? '#f1f1f1' : '#aaa',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === value ? '2px solid #ff0000' : '2px solid transparent',
            marginBottom: -1,
            cursor: 'pointer',
            transition: 'color 0.15s',
            // Touch-friendly height
            minHeight: 44,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
