import { Outlet } from 'react-router-dom';
import { ForbiddenPage } from '@/pages/shared/ForbiddenPage';
import { selectRole, useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';
import { hasRole } from '@/utils/permissions';

/** Route guard: the current role must be `min` or higher. Renders the 403 page in place otherwise. */
export function RequireRole({ min }: { min: Role }) {
  const role = useAuthStore(selectRole);
  return hasRole(role, min) ? <Outlet /> : <ForbiddenPage />;
}
