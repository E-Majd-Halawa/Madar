import { cn } from '@/utils/cn';

/** Shimmering placeholder block. Motion is removed globally when animation is "off". */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-surface-2', className)} />;
}
