import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HeaderControls } from '@/components/layout/HeaderControls';
import { ROUTES } from '@/constants/routes';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared frame for every authentication screen. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { t } = useTranslation();
  return (
    <main className="bg-ambient flex min-h-dvh flex-col px-5 py-5">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link to={ROUTES.home} aria-label={t('brand.homeLabel', { brand: t('app.name') })} className="text-lg font-semibold tracking-tight">
          {t('app.name')}
        </Link>
        <HeaderControls />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
        <div className="glass rounded-2xl p-6 shadow-depth sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}
