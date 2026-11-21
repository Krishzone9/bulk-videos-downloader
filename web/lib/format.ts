/** Format seconds into a human-readable duration string like "1:02:03" or "2:30". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format a view count into a compact string like "1.2M views" or "340K views". */
export function formatViews(count: number | null): string {
  if (count === null) return '';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`;
  return `${count.toLocaleString()} views`;
}

/** Return publishedText as-is, or empty string if null. */
export function formatPublished(text: string | null): string {
  return text ?? '';
}
