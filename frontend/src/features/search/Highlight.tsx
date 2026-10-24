import type { HighlightRange } from '@/api/contracts/search';
import { cn } from '@/utils/cn';

interface HighlightProps {
  text: string;
  ranges: HighlightRange[];
  className?: string;
  markClassName?: string;
}

/**
 * Renders a string with specified character ranges highlighted.
 * Safe from XSS — uses React elements, not dangerouslySetInnerHTML.
 */
export function Highlight({ text, ranges, className, markClassName }: HighlightProps) {
  if (!ranges.length) {
    return <span className={className}>{text}</span>;
  }

  // Merge and sort ranges, clamp to string length
  const merged: HighlightRange[] = [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  for (const r of sorted) {
    const start = Math.max(0, Math.min(r.start, text.length));
    const end   = Math.max(0, Math.min(r.end,   text.length));
    if (start >= end) continue;
    const last = merged[merged.length - 1];
    if (last && start <= last.end) {
      last.end = Math.max(last.end, end);
    } else {
      merged.push({ start, end });
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const { start, end } of merged) {
    if (cursor < start) parts.push(text.slice(cursor, start));
    parts.push(
      <mark
        key={start}
        className={cn('rounded-[2px] bg-accent/30 text-fg not-italic', markClassName)}
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <span className={className}>{parts}</span>;
}
