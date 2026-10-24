import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FullScreenLoader() {
  const { t } = useTranslation();
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-bg">
      <div className="flex items-center gap-3 text-muted">
        <Loader2 className="size-5 animate-spin text-accent" aria-hidden />
        <span className="text-sm">{t('common.loading')}</span>
      </div>
    </div>
  );
}
