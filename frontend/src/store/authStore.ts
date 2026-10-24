import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AuthError, type AuthErrorCode, type LoginInput, type RegisterInput } from '@/api/contracts';
import { authService } from '@/services/authService';
import { safeStateStorage } from '@/services/storage/persistStorage';
import type { AuthSession, Role, User } from '@/types';

interface AuthState {
  session: AuthSession | null;
  status: 'idle' | 'loading';
  error: AuthErrorCode | null;
  /** Set at sign-in: when false the session ends with the browser tab. */
  remember: boolean;
  login: (input: LoginInput, remember?: boolean) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  enterDemo: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/** Marks this browser tab as having signed in, so "remember me" off can end the session when the tab closes. */
const TAB_KEY = 'tf3d.tab';
function markTabAlive(): void {
  try {
    window.sessionStorage.setItem(TAB_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Called once at startup: drops a non-remembered session left over from a previous browser session. */
export function enforceRememberMe(): void {
  const { session, remember } = useAuthStore.getState();
  let alive = false;
  try {
    alive = window.sessionStorage.getItem(TAB_KEY) === '1';
  } catch {
    alive = true;
  }
  if (session && !remember && !alive) useAuthStore.setState({ session: null });
}

const toCode = (error: unknown): AuthErrorCode => (error instanceof AuthError ? error.code : 'unknown');

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const run = async (action: () => Promise<AuthSession>): Promise<boolean> => {
        set({ status: 'loading', error: null });
        try {
          set({ session: await action(), status: 'idle' });
          return true;
        } catch (error) {
          set({ status: 'idle', error: toCode(error) });
          return false;
        }
      };

      return {
        session: null,
        status: 'idle',
        error: null,
        remember: true,
        login: (input, remember = true) => {
          set({ remember });
          markTabAlive();
          return run(() => authService.login(input));
        },
        register: (input) => {
          markTabAlive();
          return run(() => authService.register(input));
        },
        enterDemo: () => {
          set({ remember: false });
          markTabAlive();
          return run(() => authService.loginAsDemo());
        },
        logout: async () => {
          const refreshToken = get().session?.tokens.refreshToken;
          set({ session: null, error: null });
          await authService.logout(refreshToken).catch(() => undefined);
        },
        clearError: () => set({ error: null }),
      };
    },
    {
      name: 'tf3d.auth',
      version: 1,
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (state) => ({ session: state.session, remember: state.remember }),
    },
  ),
);

export const selectRole = (state: { session: AuthSession | null }): Role | undefined =>
  state.session?.user.role;

export const selectUser = (state: { session: AuthSession | null }): User | undefined =>
  state.session?.user;
