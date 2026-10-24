import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

interface WidgetProps {
  title: string;
  to?: string;
  children: ReactNode;
  className?: string;
}

export function Widget({ title, to, children, className }: WidgetProps) {
  const { t } = useTranslation();
  return (
    <section aria-label={title} className={cn('glass rounded-2xl p-5', className)}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {to && (
          <Link to={to} className="text-xs text-accent hover:underline">
            {t('common.viewAll')}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
