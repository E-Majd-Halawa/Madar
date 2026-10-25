import { SetMetadata } from '@nestjs/common';
import type { Permission } from './permissions.js';

export const REQUIRED_PERMISSIONS_KEY = 'madar:requiredPermissions';

/**
 * Declares the permissions required to hit a route. All listed permissions
 * must be present (the role inheritance already expands lower roles).
 *
 * Must be used on authenticated routes: JwtAuthGuard runs before
 * PermissionsGuard and populates `request.user`.
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
