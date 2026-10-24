import type { Role } from '@/types';

/** Lowest to highest. Each role inherits everything below it. */
export const ROLE_ORDER: Role[] = ['user', 'moderator', 'admin', 'super_admin'];

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
  super_admin: ['admins:manage', 'system:manage_settings', 'roles:manage', 'security:full'],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof PERMISSIONS_BY_ROLE)[Role][number];

export const ALL_PERMISSIONS: Permission[] = ROLE_ORDER.flatMap(
  (role) => [...PERMISSIONS_BY_ROLE[role]] as Permission[],
);

/** Effective (cumulative) permissions per role. */
export const ROLE_PERMISSIONS = ROLE_ORDER.reduce(
  (acc, role, index) => {
    const inherited: ReadonlySet<Permission> =
      index > 0 ? acc[ROLE_ORDER[index - 1]] : new Set<Permission>();
    acc[role] = new Set<Permission>([...inherited, ...PERMISSIONS_BY_ROLE[role]]);
    return acc;
  },
  {} as Record<Role, ReadonlySet<Permission>>,
);
