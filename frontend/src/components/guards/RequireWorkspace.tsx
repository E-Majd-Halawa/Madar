import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { StatusPage } from '@/components/ui/StatusPage';
import { ForbiddenPage } from '@/pages/shared/ForbiddenPage';
import { useAuthStore } from '@/store/authStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';

/** The user must be a member of the active workspace. Waits for workspaces to load first. */
export function RequireWorkspace() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.user.id);
  const role = useAuthStore((s) => s.session?.user.role);
  const status = useWorkspaceStore((s) => s.status);
  const active = useWorkspaceStore(selectActiveWorkspace);
  const load = useWorkspaceStore((s) => s.load);

  // Keep the app shell mounted during background reloads/creations; only block the
  // very first load, or a load with no workspace to fall back to.
  if (status === 'idle' || (status === 'loading' && !active)) return <FullScreenLoader />;

  // A failed list request is not the same as "not a member": offer a retry instead
  // of a misleading 403 when there is no workspace to render yet.
  if (status === 'error' && !active) {
    return (
      <StatusPage
        title={t('errors.somethingWrong')}
        body={t('errors.somethingWrongBody')}
        actions={
          <Button variant="primary" onClick={() => userId && void load(userId)}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  }

  // Global admins may open any workspace (backend/src/modules/workspaces/workspaces.service.ts:55-65).
  const isGlobalAdmin = role === 'admin' || role === 'super_admin';
  if (!active || !userId || (!isGlobalAdmin && !active.memberIds.includes(userId))) {
    return <ForbiddenPage message={t('errors.noWorkspace')} />;
  }
  return <Outlet />;
}
