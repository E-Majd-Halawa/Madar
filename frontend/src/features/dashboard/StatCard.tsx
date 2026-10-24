import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  tone?: 'accent' | 'danger' | 'info';
  hint?: string;
}

const TONES = { accent: 'bg-accent/12 text-accent', danger: 'bg-danger/12 text-danger', info: 'bg-accent-2/12 text-accent-2' };

export function StatCard({ label, value, suffix = '', icon: Icon, tone = 'accent', hint }: StatCardProps) {
  const shown = useCountUp(value);
  return (
    <div className="glass rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className={cn('grid size-8 place-items-center rounded-lg', TONES[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
        {shown}
        {suffix}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
