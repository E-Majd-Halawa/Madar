import { BarChart3, CalendarDays, CheckSquare, Columns3, FolderKanban, MessageSquare, Sparkles, Timer, Users, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { cn } from '@/utils/cn';

const FEATURES: Array<{ id: string; Icon: LucideIcon; wide?: boolean }> = [
  { id: 'tasks', Icon: CheckSquare, wide: true },
  { id: 'projects', Icon: FolderKanban },
  { id: 'kanban', Icon: Columns3 },
  { id: 'calendar', Icon: CalendarDays },
  { id: 'focus', Icon: Timer },
  { id: 'team', Icon: Users },
  { id: 'analytics', Icon: BarChart3, wide: true },
  { id: 'chat', Icon: MessageSquare },
  { id: 'ai', Icon: Sparkles, wide: true },
];

export function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.features.title')}</h2>
        <p className="mt-3 text-muted">{t('landing.features.subtitle')}</p>
      </div>

      <RevealGroup className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ id, Icon, wide }) => (
          <RevealItem key={id} className={cn(wide && 'lg:col-span-2')}>
            <article className="glass h-full rounded-2xl p-6 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow focus-within:-translate-y-0.5 focus-within:border-accent/40 focus-within:shadow-glow">
              <span className="grid size-10 place-items-center rounded-xl bg-accent/12 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{t(`landing.features.items.${id}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted">{t(`landing.features.items.${id}.desc`)}</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {(['b1', 'b2', 'b3'] as const).map((key) => (
                  <li key={key} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                    {t(`landing.features.items.${id}.${key}`)}
                  </li>
                ))}
              </ul>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
