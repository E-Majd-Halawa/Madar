import { Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';
import { hasRole } from '@/utils/permissions';

interface GuardCase {
  to: string;
  labelKey: string;
  /** null = no signed-in user required to be blocked, route simply does not exist */
  requires: 'auth' | Role | 'missing';
}

const CASES: GuardCase[] = [
  { to: ROUTES.app.dashboard, labelKey: 'guardLabels.dashboard', requires: 'auth' },
  { to: ROUTES.admin.root, labelKey: 'guardLabels.admin', requires: 'admin' },
  { to: ROUTES.admin.users, labelKey: 'guardLabels.adminUsers', requires: 'admin' },
  { to: ROUTES.admin.settings, labelKey: 'guardLabels.adminSettings', requires: 'super_admin' },
  { to: '/this-page-does-not-exist', labelKey: 'guardLabels.missing', requires: 'missing' },
];

export function GuardTestCard() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const role = session?.user.role;

  const shouldOpen = (requires: GuardCase['requires']): boolean | null => {
    if (requires === 'missing') return null;
    if (requires === 'auth') return session !== null;
    return hasRole(role, requires);
  };

  return (
    <Card
      title={t('foundation.guards')}
      description={t('foundation.guardsHint')}
      icon={<Route className="size-5" aria-hidden />}
    >
      <ul className="divide-y">
        {CASES.map(({ to, labelKey, requires }) => {
          const open = shouldOpen(requires);
          return (
            <li key={to} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm">{t(labelKey)}</p>
                <p className="text-xs text-muted" dir="ltr">
                  {to}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {open !== null && (
                  <Badge tone={open ? 'accent' : 'warning'}>
                    {open ? t('foundation.guardPass') : t('foundation.guardBlocked')}
                  </Badge>
                )}
                <Link to={to} className="text-sm font-medium text-accent hover:underline">
                  {t('foundation.guardOpen')}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
