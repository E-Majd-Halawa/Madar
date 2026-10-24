import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { StatusPage } from '@/components/ui/StatusPage';
import { ROUTES } from '@/constants/routes';
import { NotFoundPage } from './NotFoundPage';

/** Router-level error boundary: unknown routes render the 404, everything else a recoverable error screen. */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <StatusPage
      title={t('errors.somethingWrong')}
      body={t('errors.somethingWrongBody')}
      actions={
        <>
          <Button variant="primary" onClick={() => window.location.reload()}>
            {t('common.tryAgain')}
          </Button>
          <Link to={ROUTES.home} className="inline-flex h-10 items-center rounded-xl border bg-surface-2 px-4 text-sm font-medium">
            {t('common.backHome')}
          </Link>
        </>
      }
    />
  );
}
