import { ROUTES } from '@/constants/routes';

/** Auth screens are never valid post-login destinations (would cause a redirect loop). */
const AUTH_PATHS = new Set<string>([
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]);

/** Only same-site, non-auth paths are honored, so a redirect param can't send users elsewhere. */
export const safeRedirect = (value: string | null, fallback: string = ROUTES.app.dashboard): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  const path = value.split(/[?#]/, 1)[0];
  return AUTH_PATHS.has(path) ? fallback : value;
};
