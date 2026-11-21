const CARD_STYLE: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#161616',
};

const THUMB_STYLE: React.CSSProperties = {
  aspectRatio: '16/9',
  width: '100%',
  background: 'linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.5s infinite',
};

const LINE_STYLE: React.CSSProperties = {
  borderRadius: 4,
  background: 'linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.5s infinite',
};

export function Skeleton() {
  return (
    <div style={CARD_STYLE}>
      <div style={THUMB_STYLE} />
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ ...LINE_STYLE, height: 12, width: '100%' }} />
        <div style={{ ...LINE_STYLE, height: 12, width: '70%' }} />
        <div style={{ ...LINE_STYLE, height: 10, width: '40%' }} />
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(140px, 100%), 1fr))',
      gap: 10,
    }}>
      {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
    </div>
  );
}
