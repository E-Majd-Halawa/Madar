import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ icon: Icon, title, body, description, action }: { icon: LucideIcon; title: string; body?: string; description?: string; action?: ReactNode }) {
  const content = body || description;
  return (
    <div className="grid place-items-center px-6 py-10 text-center">
      <span className="relative grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent shadow-glow">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {content && <p className="mt-1 max-w-xs text-sm text-muted">{content}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
