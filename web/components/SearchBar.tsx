'use client';

import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%', gap: 6 }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Channel name or link"
        aria-label="YouTube channel name or link"
        enterKeyHint="search"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        style={{
          flex: 1,
          backgroundColor: '#121212',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 24,
          padding: '10px 16px',
          fontSize: 14,
          color: '#f1f1f1',
          outline: 'none',
          transition: 'border-color 0.2s',
          // Prevent iOS zoom on focus (font-size ≥ 16px)
          minHeight: 44,
        }}
        onFocus={e => { e.target.style.borderColor = '#ff0000'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        aria-label={loading ? 'Loading channel' : 'Fetch channel'}
        style={{
          backgroundColor: loading || !value.trim() ? '#3a0000' : '#ff0000',
          color: 'white',
          border: 'none',
          borderRadius: 24,
          padding: '10px 18px',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !value.trim() ? 0.6 : 1,
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          // Minimum touch target
          minHeight: 44,
          minWidth: 44,
        }}
      >
        {loading ? '…' : 'Go'}
      </button>
    </form>
  );
}
