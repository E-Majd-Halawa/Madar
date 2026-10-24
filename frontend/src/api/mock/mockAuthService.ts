import { AuthError, type AuthService } from '@/api/contracts';
import { SEED_USERS } from '@/data/users';
import type { AuthSession, AuthTokens, User } from '@/types';
import { delay } from './delay';
import {
  findAccountByEmail,
  getAllUsers,
  isEmailTaken,
  isUsernameTaken,
  registerAccount,
} from './userRegistry';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function issueTokens(user: User): AuthTokens {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = btoa(JSON.stringify({ sub: user.id, role: user.role, exp: expiresAt }));
  return {
    accessToken: `mock.${payload}.signature`,
    refreshToken: `mock-refresh.${user.id}.${expiresAt}`,
    expiresAt,
  };
}

const toSession = (user: User, isDemo = false): AuthSession => ({
  user,
  tokens: issueTokens(user),
  isDemo,
});

export const mockAuthService: AuthService = {
  async login({ email, password }) {
    await delay(500);
    const account = findAccountByEmail(email);
    if (!account || account.password !== password) {
      throw new AuthError('invalid_credentials', 'Invalid email or password.');
    }
    if (account.user.status === 'suspended') {
      throw new AuthError('account_suspended', 'This account is suspended.');
    }
    return toSession(account.user);
  },

  async register({ fullName, username, email, password }) {
    await delay(700);
    if (isEmailTaken(email)) throw new AuthError('email_taken', 'Email is already registered.');
    if (isUsernameTaken(username)) throw new AuthError('username_taken', 'Username is taken.');
    const now = new Date().toISOString();
    const user: User = {
      id: `u-${Date.now().toString(36)}`,
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      status: 'active',
      createdAt: now,
      lastActiveAt: now,
    };
    registerAccount(user, password);
    return toSession(user);
  },

  async loginAsDemo() {
    await delay(300);
    const demoUser = SEED_USERS.find((u) => u.id === 'u-001');
    if (!demoUser) throw new AuthError('unknown', 'Demo user is unavailable.');
    return toSession(demoUser, true);
  },

  async logout() {
    await delay(100);
  },

  async refresh(refreshToken) {
    await delay(150);
    const [, userId, expiry] = refreshToken.split('.');
    const user = getAllUsers().find((u) => u.id === userId);
    if (!user || Number(expiry) < Date.now()) {
      throw new AuthError('session_expired', 'Session expired.');
    }
    return issueTokens(user);
  },

  async requestPasswordReset() {
    // Real backends answer identically whether or not the email exists.
    await delay(600);
  },
};
