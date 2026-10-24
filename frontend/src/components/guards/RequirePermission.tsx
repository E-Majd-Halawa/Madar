import { Outlet } from 'react-router-dom';
import type { Permission } from '@/constants/permissions';
import { ForbiddenPage } from '@/pages/shared/ForbiddenPage';
import { selectRole, useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';

/** Route guard for a specific permission rather than a role level. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const role = useAuthStore(selectRole);
  return hasPermission(role, permission) ? <Outlet /> : <ForbiddenPage />;
}
