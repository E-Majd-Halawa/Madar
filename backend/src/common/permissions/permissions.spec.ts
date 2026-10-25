import {
  PERMISSIONS_BY_ROLE,
  ROLE_ORDER,
  ROLE_PERMISSIONS,
  roleHasPermission,
  type Permission,
  type Role,
} from './permissions.js';

describe('RBAC permission inheritance', () => {
  it.each(ROLE_ORDER)(
    '%s has every permission of the roles below it',
    (role) => {
      const index = ROLE_ORDER.indexOf(role);
      const expected = new Set<Permission>(
        ROLE_ORDER.slice(0, index + 1).flatMap((lowerRole) => [
          ...PERMISSIONS_BY_ROLE[lowerRole],
        ]),
      );

      expect(ROLE_PERMISSIONS[role]).toEqual(expected);
    },
  );

  it('user does not have admin or moderator permissions', () => {
    expect(roleHasPermission('user', 'tasks:manage_own')).toBe(true);
    expect(roleHasPermission('user', 'chat:delete_any_message')).toBe(false);
    expect(roleHasPermission('user', 'users:manage')).toBe(false);
    expect(roleHasPermission('user', 'security:full')).toBe(false);
  });

  it('moderator inherits user permissions plus moderation ones', () => {
    expect(roleHasPermission('moderator', 'tasks:manage_own')).toBe(true);
    expect(roleHasPermission('moderator', 'chat:moderate')).toBe(true);
    expect(roleHasPermission('moderator', 'users:manage')).toBe(false);
  });

  it('admin inherits moderator permissions plus admin ones', () => {
    expect(roleHasPermission('admin', 'chat:delete_any_message')).toBe(true);
    expect(roleHasPermission('admin', 'users:manage')).toBe(true);
    expect(roleHasPermission('admin', 'admins:manage')).toBe(false);
  });

  it('super_admin has every permission', () => {
    for (const role of ROLE_ORDER) {
      for (const permission of PERMISSIONS_BY_ROLE[role]) {
        expect(roleHasPermission('super_admin', permission as Permission)).toBe(
          true,
        );
      }
    }
  });

  it('orders roles from lowest to highest', () => {
    expect(ROLE_ORDER).toEqual<Role[]>([
      'user',
      'moderator',
      'admin',
      'super_admin',
    ]);
  });
});
