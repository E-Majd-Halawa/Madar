import { Focus, Layers, Plug, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

const ITEMS = [
  { id: 'unified', Icon: Layers },
  { id: 'focus', Icon: Focus },
  { id: 'team', Icon: Users },
  { id: 'api', Icon: Plug },
] as const;

export function WhySection() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.why.title')}</h2>
          <p className="mt-3 max-w-md text-muted">{t('landing.why.subtitle')}</p>
        </div>
        <RevealGroup>
          <div className="divide-y">
            {ITEMS.map(({ id, Icon }) => (
              <RevealItem key={id} className="flex gap-5 py-7 first:pt-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t(`landing.why.items.${id}.title`)}</h3>
                  <p className="mt-1.5 text-muted">{t(`landing.why.items.${id}.desc`)}</p>
                </div>
              </RevealItem>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}
