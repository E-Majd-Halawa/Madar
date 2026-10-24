import { DEMO_CREDENTIALS, SEED_USERS } from '@/data/users';
import { storage } from '@/services/storage/storageAdapter';
import type { User } from '@/types';

const KEY = 'mock.registered';

interface RegisteredAccount {
  user: User;
  /** Mock only. A real backend never returns or stores plain passwords. */
  password: string;
}

const readRegistered = (): RegisteredAccount[] => storage.get<RegisteredAccount[]>(KEY) ?? [];

export const getAllUsers = (): User[] => [...SEED_USERS, ...readRegistered().map((a) => a.user)];

export function findAccountByEmail(email: string): RegisteredAccount | null {
  const needle = email.trim().toLowerCase();
  const demo = DEMO_CREDENTIALS[needle];
  if (demo) {
    const user = SEED_USERS.find((u) => u.id === demo.userId);
    return user ? { user, password: demo.password } : null;
  }
  return readRegistered().find((a) => a.user.email.toLowerCase() === needle) ?? null;
}

export const isEmailTaken = (email: string) =>
  getAllUsers().some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

export const isUsernameTaken = (username: string) =>
  getAllUsers().some((u) => u.username.toLowerCase() === username.trim().toLowerCase());

export function registerAccount(user: User, password: string): void {
  storage.set(KEY, [...readRegistered(), { user, password }]);
}
