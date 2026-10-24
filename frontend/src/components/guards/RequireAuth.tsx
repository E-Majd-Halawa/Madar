import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

/** Any signed-in user. Sends guests (and expired sessions) to sign-in, remembering where they were going. */
export function RequireAuth() {
  const session = useAuthStore((s) => s.session);
  const location = useLocation();

  const redirect = encodeURIComponent(location.pathname + location.search);
  if (!session) return <Navigate to={`${ROUTES.login}?redirect=${redirect}`} replace />;
  if (session.tokens.expiresAt < Date.now()) {
    return <Navigate to={`${ROUTES.login}?reason=expired&redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}
