import { ROLE_ORDER, ROLE_PERMISSIONS, type Permission } from '@/constants/permissions';
import type { Role } from '@/types';

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].has(permission);
}

/** True when `role` is `min` or higher in the hierarchy. */
export function hasRole(role: Role | null | undefined, min: Role): boolean {
  return !!role && ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}
