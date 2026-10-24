import { cn } from '@/utils/cn';

const PALETTE = ['#10b981', '#22d3ee', '#a78bfa', '#f59e0b', '#3b82f6', '#f43f5e', '#14b8a6'];

const hash = (value: string) => [...value].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const SIZES = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' } as const;

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Deterministic initials avatar: the same name always gets the same color. */
export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const color = PALETTE[hash(name) % PALETTE.length];
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        role="img"
        aria-label={name}
        className={cn('inline-grid shrink-0 rounded-full object-cover', SIZES[size].replace('text-', ''), className)}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold text-black/80', SIZES[size], className)}
      style={{ backgroundColor: color }}
    >
      {initials(name)}
    </span>
  );
}
