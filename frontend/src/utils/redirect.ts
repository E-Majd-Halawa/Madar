import { ROUTES } from '@/constants/routes';

/** Only same-site paths are honored, so a redirect param can't send users elsewhere. */
export const safeRedirect = (value: string | null, fallback: string = ROUTES.app.dashboard): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
