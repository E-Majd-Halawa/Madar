import { Info, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export function DemoBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDemo = useAuthStore((s) => s.session?.isDemo);
  const logout = useAuthStore((s) => s.logout);
  if (!isDemo) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-warning/15 px-4 py-1.5 text-xs text-warning">
      <Info className="size-3.5 shrink-0" aria-hidden />
      <span className="font-semibold">{t('common.demoMode')}</span>
      <span className="hidden sm:inline">{t('shell.demoBanner')}</span>
      <button
        type="button"
        className="underline underline-offset-2"
        onClick={async () => {
          await logout();
          navigate(ROUTES.home, { replace: true });
        }}
      >
        {t('shell.exitDemo')}
      </button>
    </div>
  );
}

/** Phase 9 adds the offline queue; the banner is wired now so the shell already reacts to connectivity. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-danger/15 px-4 py-1.5 text-xs text-danger">
      <WifiOff className="size-3.5" aria-hidden />
      {t('shell.offline')}
    </div>
  );
}
