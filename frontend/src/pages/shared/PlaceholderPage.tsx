import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useMatches } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export interface PlaceholderHandle {
  titleKey: string;
  phase: number;
  guards: Array<'auth' | 'workspace' | 'admin' | 'super_admin'>;
}

/**
 * Temporary landing spot for routes whose real pages arrive in later phases.
 * It exists so route guards can be verified now; each route is replaced by its real page.
 */
export default function PlaceholderPage() {
  const { t } = useTranslation();
  const matches = useMatches();
  const handle = matches[matches.length - 1]?.handle as PlaceholderHandle | undefined;
  const user = useAuthStore((s) => s.session?.user);

  const guards = (handle?.guards ?? []).map((g) => t(`placeholder.guards.${g}`)).join(', ');

  return (
    <main className="bg-ambient grid min-h-dvh place-items-center px-6">
      <div className="glass w-full max-w-lg rounded-2xl p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold">{handle ? t(handle.titleKey) : t('placeholder.title')}</h1>
        <p className="mt-1 text-sm font-medium text-accent">{t('placeholder.title')}</p>
        <p className="mt-3 text-sm text-muted">
          {t('placeholder.body', { guards, phase: handle?.phase ?? '?' })}
        </p>
        {user && (
          <p className="mt-4 flex items-center gap-2 text-sm">
            {user.fullName}
            <Badge tone="accent">{t(`roles.${user.role}`)}</Badge>
          </p>
        )}
        <Link
          to={ROUTES.home}
          className="mt-6 inline-flex h-10 items-center rounded-xl border bg-surface-2 px-4 text-sm font-medium"
        >
          {t('common.backHome')}
        </Link>
      </div>
    </main>
  );
}
