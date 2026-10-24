import { KeyRound, MonitorSmartphone, ScrollText, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

const ITEMS = [
  { id: 'rbac', Icon: ShieldCheck },
  { id: 'audit', Icon: ScrollText },
  { id: 'twofa', Icon: KeyRound },
  { id: 'sessions', Icon: MonitorSmartphone },
] as const;

export function SecuritySection() {
  const { t } = useTranslation();
  return (
    <section id="security" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.security.title')}</h2>
        <p className="mt-3 text-muted">{t('landing.security.subtitle')}</p>
      </div>
      <RevealGroup className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {ITEMS.map(({ id, Icon }) => (
          <RevealItem key={id} className="flex gap-4">
            <Icon className="mt-1 size-6 shrink-0 text-accent" aria-hidden />
            <div>
              <h3 className="font-semibold">{t(`landing.security.items.${id}.title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`landing.security.items.${id}.desc`)}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
