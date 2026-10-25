/**
 * Single source of truth for RBAC, mirrored from
 * frontend/src/constants/permissions.ts (roles, strings and inheritance).
 */

/** Lowest to highest. Each role inherits everything below it. */
export const ROLE_ORDER = [
  'user',
  'moderator',
  'admin',
  'super_admin',
] as const;

export type Role = (typeof ROLE_ORDER)[number];

/** Permissions a role adds on top of the roles below it. */
export const PERMISSIONS_BY_ROLE = {
  user: [
    'tasks:manage_own',
    'projects:manage_own',
    'workspace:participate',
    'chat:send',
    'profile:edit_own',
    'settings:manage_own',
  ],
  moderator: [
    'chat:moderate',
    'chat:delete_reported',
    'chat:create_channel',
    'chat:post_in_announcements',
    'chat:delete_any_message',
    'users:warn',
    'users:mute',
    'reports:review',
  ],
  admin: [
    'users:manage',
    'users:suspend',
    'projects:manage_all',
    'workspace:manage_settings',
    'analytics:view',
    'audit:view',
  ],
  super_admin: [
    'admins:manage',
    'system:manage_settings',
    'roles:manage',
    'security:full',
  ],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof PERMISSIONS_BY_ROLE)[Role][number];

/** Effective (cumulative) permissions per role. */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = (() => {
  const result = {} as Record<Role, ReadonlySet<Permission>>;
  let inherited = new Set<Permission>();

  for (const role of ROLE_ORDER) {
    inherited = new Set<Permission>([
      ...inherited,
      ...PERMISSIONS_BY_ROLE[role],
    ]);
    result[role] = inherited;
  }

  return result;
})();

export function permissionsForRole(role: Role): ReadonlySet<Permission> {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function isRole(value: string): value is Role {
  return (ROLE_ORDER as readonly string[]).includes(value);
}
