import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';
import { selectActiveWorkspace, useWorkspaceStore } from '@/store/workspaceStore';
import { canManageWorkspaceMembers } from '@/utils/permissions';

/**
 * Members management belongs to the owner of a team workspace. Redirecting
 * (rather than showing a 403) keeps the app usable when the user switches to a
 * personal workspace or to a team workspace they only belong to.
 */
export function RequireWorkspaceOwner() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const active = useWorkspaceStore(selectActiveWorkspace);

  if (!canManageWorkspaceMembers(active, userId)) {
    return <Navigate to={ROUTES.app.dashboard} replace />;
  }

  return <Outlet />;
}
