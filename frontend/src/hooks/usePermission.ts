import { useMemo } from 'react';
import type { Permission } from '@/constants/permissions';
import { selectRole, useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';
import { hasPermission, hasRole } from '@/utils/permissions';

export function usePermission() {
  const role = useAuthStore(selectRole);

  return useMemo(
    () => ({
      role,
      can: (permission: Permission) => hasPermission(role, permission),
      atLeast: (min: Role) => hasRole(role, min),
    }),
    [role],
  );
}
