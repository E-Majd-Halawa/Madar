import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function Card({ title, description, icon, className, children, ...rest }: CardProps) {
  return (
    <section className={cn('glass rounded-2xl p-5 sm:p-6', className)} {...rest}>
      {(title || description) && (
        <header className="mb-5 flex items-start gap-3">
          {icon && <span className="mt-0.5 text-accent">{icon}</span>}
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
