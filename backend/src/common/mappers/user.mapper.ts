import type { User, UserStatus } from '../contracts/api.contracts.js';
import type { Role } from '../permissions/permissions.js';

/** The only fields the API ever exposes from a user row. */
export interface UserRecord {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: Date;
  lastActiveAt: Date;
}

/**
 * Explicit mapper to the frontend `User` shape.
 * `passwordHash` and every token field are intentionally absent.
 */
export function toUserDto(user: UserRecord): User {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role as Role,
    status: user.status as UserStatus,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt.toISOString(),
  };
}
