import { setTokenProvider } from '@/api/adapters/http/httpClient';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

export function setupTokenProvider(): void {
  setTokenProvider({
    getAccessToken() {
      const session = useAuthStore.getState().session;
      return session?.tokens?.accessToken ?? null;
    },
    async refresh() {
      const session = useAuthStore.getState().session;
      const refreshToken = session?.tokens?.refreshToken;
      if (!refreshToken) return null;
      try {
        const tokens = await authService.refresh(refreshToken);
        if (tokens && tokens.accessToken) {
          const currentSession = useAuthStore.getState().session;
          if (currentSession) {
            useAuthStore.setState({
              session: {
                ...currentSession,
                tokens,
              },
            });
          }
          return tokens.accessToken;
        }
      } catch {
        await useAuthStore.getState().logout();
      }
      return null;
    },
  });
}
