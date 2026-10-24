import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface OptionCardProps {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  body?: string;
  icon?: ReactNode;
}

/** Large selectable card built on a native input, so keyboard and screen readers work for free. */
export function OptionCard({ type, name, checked, onChange, title, body, icon }: OptionCardProps) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
        checked ? 'border-accent bg-accent/10 shadow-glow' : 'hover:border-border/30 hover:bg-surface-2/60',
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="sr-only" />
      {icon && <span className="mt-0.5 text-accent">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {body && <span className="mt-0.5 block text-xs text-muted">{body}</span>}
      </span>
      <span
        aria-hidden
        className={cn('grid size-5 shrink-0 place-items-center rounded-full border', checked ? 'border-accent bg-accent text-accent-fg' : 'border-border/20')}
      >
        {checked && <Check className="size-3" />}
      </span>
    </label>
  );
}
