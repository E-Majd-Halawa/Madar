import type { AuthService, LoginInput, RegisterInput, AuthErrorCode } from '@/api/contracts';
import { AuthError } from '@/api/contracts';
import type { AuthSession, AuthTokens } from '@/types';
import { http, HttpError } from './httpClient';

function mapAuthError(error: unknown): never {
  if (error instanceof HttpError) {
    const backendCode = error.code;
    let mappedCode: AuthErrorCode = 'unknown';
    if (backendCode === 'invalid_credentials') mappedCode = 'invalid_credentials';
    else if (backendCode === 'account_suspended') mappedCode = 'account_suspended';
    else if (backendCode === 'email_taken') mappedCode = 'email_taken';
    else if (backendCode === 'username_taken') mappedCode = 'username_taken';
    else if (backendCode === 'session_expired') mappedCode = 'session_expired';
    throw new AuthError(mappedCode, error.message);
  }
  throw error;
}

export const httpAuthService: AuthService = {
  async login(input: LoginInput): Promise<AuthSession> {
    try {
      return await http<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (err) {
      return mapAuthError(err);
    }
  },
  async register(input: RegisterInput): Promise<AuthSession> {
    try {
      return await http<AuthSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch (err) {
      return mapAuthError(err);
    }
  },
  async loginAsDemo(): Promise<AuthSession> {
    try {
      return await http<AuthSession>('/auth/demo', {
        method: 'POST',
      });
    } catch (err) {
      return mapAuthError(err);
    }
  },
  async logout(refreshToken?: string): Promise<void> {
    try {
      await http<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore logout failure
    }
  },
  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      return await http<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      return mapAuthError(err);
    }
  },
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await http<void>('/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch {
      // ignore
    }
  },
};
