import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatusPage } from '@/components/ui/StatusPage';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

/** Phase 1 version. The 3D 404 scene replaces the plain code in a later phase. */
export function NotFoundPage() {
  const { t } = useTranslation();
  const signedIn = useAuthStore((s) => s.session !== null);
  return (
    <StatusPage
      code="404"
      title={t('errors.notFoundTitle')}
      body={t('errors.notFoundBody')}
      actions={
        <Link
          to={signedIn ? ROUTES.app.dashboard : ROUTES.home}
          className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg shadow-glow"
        >
          {signedIn ? t('errors.backToDashboard') : t('common.backHome')}
        </Link>
      }
    />
  );
}
