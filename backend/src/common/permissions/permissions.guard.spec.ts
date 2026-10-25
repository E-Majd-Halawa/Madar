import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from './require-permission.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';
import type { Role } from './permissions.js';

class TestController {}

const handlerWith = (permissions?: string[]) => {
  const handler = () => undefined;
  if (permissions) {
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, permissions, handler);
  }
  return handler;
};

function context(handler: () => void, role?: Role): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('allows routes without a permission requirement', () => {
    const handler = handlerWith();
    expect(guard.canActivate(context(handler))).toBe(true);
    expect(guard.canActivate(context(handler, 'user'))).toBe(true);
  });

  it('denies a user without the required permission', () => {
    const handler = handlerWith(['users:manage']);

    try {
      guard.canActivate(context(handler, 'user'));
      throw new Error('expected ForbiddenException');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: 'forbidden',
      });
    }
  });

  it('denies a moderator when the permission is admin-only', () => {
    const handler = handlerWith(['users:manage']);
    expect(() => guard.canActivate(context(handler, 'moderator'))).toThrow(
      ForbiddenException,
    );
  });

  it('allows an admin for users:manage', () => {
    const handler = handlerWith(['users:manage']);
    expect(guard.canActivate(context(handler, 'admin'))).toBe(true);
  });

  it('lets moderator use inherited moderation permissions', () => {
    const handler = handlerWith(['chat:delete_any_message']);
    expect(() => guard.canActivate(context(handler, 'user'))).toThrow(
      ForbiddenException,
    );
    expect(guard.canActivate(context(handler, 'moderator'))).toBe(true);
    expect(guard.canActivate(context(handler, 'admin'))).toBe(true);
  });

  it('requires all listed permissions (AND)', () => {
    const handler = handlerWith(['chat:moderate', 'users:manage']);
    expect(() => guard.canActivate(context(handler, 'moderator'))).toThrow(
      ForbiddenException,
    );
    expect(guard.canActivate(context(handler, 'admin'))).toBe(true);
  });

  it('allows super_admin for admins:manage', () => {
    const handler = handlerWith(['admins:manage']);
    expect(guard.canActivate(context(handler, 'super_admin'))).toBe(true);
    expect(() => guard.canActivate(context(handler, 'admin'))).toThrow(
      ForbiddenException,
    );
  });

  it('throws 401 when the request has no authenticated user', () => {
    const handler = handlerWith(['users:manage']);
    expect(() => guard.canActivate(context(handler))).toThrow(
      UnauthorizedException,
    );
  });
});
