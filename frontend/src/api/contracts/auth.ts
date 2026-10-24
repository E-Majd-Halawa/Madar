import type { AuthSession, AuthTokens } from '@/types';

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_suspended'
  | 'email_taken'
  | 'username_taken'
  | 'session_expired'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

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

/** POST /auth/login, /auth/register, /auth/logout, /auth/refresh, /auth/password/forgot */
export interface AuthService {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  loginAsDemo(): Promise<AuthSession>;
  logout(refreshToken?: string): Promise<void>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  requestPasswordReset(email: string): Promise<void>;
}
