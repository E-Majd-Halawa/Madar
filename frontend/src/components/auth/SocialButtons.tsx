import { Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toastStore';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9a6.1 6.1 0 1 1 0-12.2c1.9 0 3.2.8 3.9 1.5l2.6-2.5A9.8 9.8 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-2H12z" />
  </svg>
);

/** UI only: OAuth needs the backend. Clicking explains that instead of silently doing nothing. */
export function SocialButtons() {
  const { t } = useTranslation();
  const notice = (provider: string) => toast.info(t('auth.social.future', { provider }));
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => notice('Google')}>
          <GoogleMark />
          Google
        </Button>
        <Button onClick={() => notice('GitHub')}>
          <Github className="size-4" aria-hidden />
          GitHub
        </Button>
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted" role="separator">
        <span className="h-px flex-1 bg-border/10" />
        {t('auth.social.or')}
        <span className="h-px flex-1 bg-border/10" />
      </div>
    </div>
  );
}
