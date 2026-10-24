import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatusPage } from '@/components/ui/StatusPage';
import { ROUTES } from '@/constants/routes';

export function ForbiddenPage({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <StatusPage
      code="403"
      title={t('errors.forbiddenTitle')}
      body={message ?? t('errors.forbiddenBody')}
      actions={
        <>
          <Link
            to={ROUTES.home}
            className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg shadow-glow"
          >
            {t('common.backHome')}
          </Link>
          <Link
            to={ROUTES.login}
            className="inline-flex h-10 items-center rounded-xl border bg-surface-2 px-4 text-sm font-medium"
          >
            {t('errors.switchAccount')}
          </Link>
        </>
      }
    />
  );
}
