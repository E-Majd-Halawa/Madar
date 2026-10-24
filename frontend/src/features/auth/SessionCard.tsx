import { UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';

export function SessionCard() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const workspace = useWorkspaceStore(selectActiveWorkspace);

  return (
    <Card title={t('foundation.session')} icon={<UserRound className="size-5" aria-hidden />}>
      {session ? (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted">{t('foundation.signedInAs')}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-medium">
              {session.user.fullName}
              <Badge tone="accent">{t(`roles.${session.user.role}`)}</Badge>
              {session.isDemo && <Badge tone="warning">{t('common.demoMode')}</Badge>}
            </p>
            <p className="text-sm text-muted">{session.user.email}</p>
            {workspace && <p className="mt-2 text-sm">{workspace.name}</p>}
          </div>
          <Button variant="secondary" onClick={() => void logout()}>
            {t('common.signOut')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('foundation.signedOutHint')}</p>
          <Link
            to={ROUTES.login}
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg shadow-glow"
          >
            {t('foundation.openSignIn')}
          </Link>
        </div>
      )}
    </Card>
  );
}
