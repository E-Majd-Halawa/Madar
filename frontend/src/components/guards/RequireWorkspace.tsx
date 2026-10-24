import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { ForbiddenPage } from '@/pages/shared/ForbiddenPage';
import { useAuthStore } from '@/store/authStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';

/** The user must be a member of the active workspace. Waits for workspaces to load first. */
export function RequireWorkspace() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.user.id);
  const status = useWorkspaceStore((s) => s.status);
  const active = useWorkspaceStore(selectActiveWorkspace);

  if (status === 'idle' || status === 'loading') return <FullScreenLoader />;
  if (!active || !userId || !active.memberIds.includes(userId)) {
    return <ForbiddenPage message={t('errors.noWorkspace')} />;
  }
  return <Outlet />;
}
