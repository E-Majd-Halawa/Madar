import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { StatusPage } from '@/components/ui/StatusPage';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

/** "Explore Demo": signs in as the demo user (Demo Mode) and opens the Demo Workspace. */
export default function DemoEntryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void enterDemo().then((ok) => {
      if (ok) navigate(ROUTES.app.dashboard, { replace: true });
      else setFailed(true);
    });
  }, [enterDemo, navigate]);

  if (!failed) return <FullScreenLoader />;
  return (
    <StatusPage
      title={t('landing.demo.failed')}
      body={t('errors.auth.unknown')}
      actions={
        <Link to={ROUTES.home} className="inline-flex h-10 items-center rounded-xl border bg-surface-2 px-4 text-sm font-medium">
          {t('common.backHome')}
        </Link>
      }
    />
  );
}
