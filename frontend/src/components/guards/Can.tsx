import type { ReactNode } from 'react';
import type { Permission } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';

/** Inline permission check for UI fragments. Route-level protection still uses the guards above. */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { can } = usePermission();
  return <>{can(permission) ? children : fallback}</>;
}
