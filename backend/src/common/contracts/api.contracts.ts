/**
 * Backend copies of the frontend API contracts.
 *
 * Source of truth:
 *  - frontend/src/api/contracts/auth.ts
 *  - frontend/src/api/contracts/users.ts
 *  - frontend/src/types/index.ts
 *
 * The backend must not import frontend source files: they are not part of the
 * backend TS project and use browser-oriented module resolution.
 */
import type { Role } from '../permissions/permissions.js';

export type UserStatus = 'active' | 'suspended' | 'invited';

/** frontend/src/types/index.ts:4-14 */
export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt: string;
}

/** frontend/src/types/index.ts:16-21 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** epoch milliseconds */
  expiresAt: number;
}

/** frontend/src/types/index.ts:23-28 */
export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  isDemo: boolean;
}

/** frontend/src/types/index.ts:43-48 */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** frontend/src/api/contracts/auth.ts:3-9 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_suspended'
  | 'email_taken'
  | 'username_taken'
  | 'session_expired'
  | 'unknown';

/** frontend/src/api/contracts/auth.ts:21-31 */
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
}
