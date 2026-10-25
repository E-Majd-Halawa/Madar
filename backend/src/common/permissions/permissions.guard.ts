import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from './require-permission.decorator.js';
import type { Permission, Role } from './permissions.js';
import { ROLE_PERMISSIONS } from './permissions.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: 'unauthorized',
        message: 'Authentication is required.',
      });
    }

    const role = user.role as Role;
    const granted = ROLE_PERMISSIONS[role];

    if (!granted || required.some((permission) => !granted.has(permission))) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: 'You do not have permission to perform this action.',
      });
    }

    return true;
  }
}
