import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { StatusPage } from '@/components/ui/StatusPage';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export function ForbiddenPage({ message }: { message?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const switchAccount = () => {
    void logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <StatusPage
      code="403"
      title={t('errors.forbiddenTitle')}
      body={message ?? t('errors.forbiddenBody')}
      actions={
        <>
          <button
            type="button"
            onClick={switchAccount}
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg shadow-glow"
          >
            {t('errors.switchAccount')}
          </button>
          <Link
            to={ROUTES.home}
            className="inline-flex h-10 items-center rounded-xl border bg-surface-2 px-4 text-sm font-medium"
          >
            {t('common.backHome')}
          </Link>
        </>
      }
    />
  );
}
