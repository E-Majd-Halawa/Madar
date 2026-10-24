import { cn } from '@/utils/cn';

type Tone = 'accent' | 'danger' | 'warning' | 'success';

const toneColors: Record<Tone, string> = {
  accent: 'var(--accent)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  success: 'var(--success)',
};

export function ProgressBar({ value, label, tone = 'accent', color, className }: { value: number; label: string; tone?: Tone; color?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const barColor = color || toneColors[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('h-1.5 overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: barColor }} />
    </div>
  );
}
