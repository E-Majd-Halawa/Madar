import { Hammer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMatches } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ComingSoonHandle {
  titleKey: string;
  phase: number;
}

/** In-shell stand-in for areas scheduled for a later phase. Navigation, guards and stores are already live for them. */
export default function ComingSoonPage() {
  const { t } = useTranslation();
  const matches = useMatches();
  const handle = matches[matches.length - 1]?.handle as ComingSoonHandle | undefined;
  const title = handle ? t(handle.titleKey) : '';
  return (
    <div className="glass rounded-2xl">
      <h1 className="sr-only">{title}</h1>
      <EmptyState
        icon={Hammer}
        title={t('shell.comingSoon', { feature: title, phase: handle?.phase ?? '?' })}
        body={t('shell.comingSoonBody', { phase: handle?.phase ?? '?' })}
      />
    </div>
  );
}
