'use client';

import Image from 'next/image';
import type { ChannelInfo } from '@/lib/types';

interface ChannelHeaderProps {
  channel: ChannelInfo | null;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  if (!channel) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {channel.avatar ? (
        <Image
          src={channel.avatar}
          alt={`${channel.name} avatar`}
          width={48}
          height={48}
          style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          unoptimized
        />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          backgroundColor: '#ff0000', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: 'white',
        }}>
          {channel.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{
          margin: 0, fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700,
          color: '#f1f1f1', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {channel.name}
        </h1>
        {channel.handle && (
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#aaa' }}>{channel.handle}</p>
        )}
      </div>
    </div>
  );
}
