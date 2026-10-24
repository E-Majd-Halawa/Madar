import { Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

const INTEGRATIONS = ['GitHub', 'Slack', 'Google Calendar', 'Figma', 'Notion', 'Linear', 'Jira', 'Zapier'];

export function IntegrationsSection() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 text-center">
      <Badge tone="warning">{t('landing.integrations.planned')}</Badge>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.integrations.title')}</h2>
      <p className="mx-auto mt-3 max-w-xl text-muted">{t('landing.integrations.subtitle')}</p>
      <RevealGroup className="mt-10 flex flex-wrap justify-center gap-3">
        {INTEGRATIONS.map((name) => (
          <RevealItem key={name}>
            <span className="glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" dir="ltr">
              <Plug className="size-4 text-muted" aria-hidden />
              {name}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
