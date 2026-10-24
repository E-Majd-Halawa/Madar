import { useId, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { BoardPreview } from '@/features/landing/BoardPreview';
import { FocusPreview } from '@/features/landing/FocusPreview';
import { TaskListPreview } from '@/features/landing/TaskListPreview';
import { cn } from '@/utils/cn';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

type Tab = 'tasks' | 'board' | 'focus';
const TABS: Tab[] = ['tasks', 'board', 'focus'];

export function ProductPreviewSection() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('tasks');
  const baseId = useId();

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    const rtl = document.documentElement.dir === 'rtl';
    const index = TABS.indexOf(tab) + (rtl ? -step : step);
    setTab(TABS[(index + TABS.length) % TABS.length]);
  };

  return (
    <section id="preview" className="mx-auto max-w-5xl px-6 py-24">
      <RevealGroup>
        <RevealItem className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('landing.preview.title')}</h2>
          <p className="mt-3 text-muted">{t('landing.preview.subtitle')}</p>
        </RevealItem>

        <RevealItem className="glass mt-10 overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-sm font-medium">{t('landing.preview.workspace')}</p>
            <div role="tablist" aria-label={t('landing.preview.title')} onKeyDown={onKeyDown} className="inline-flex gap-1 rounded-xl border bg-surface-2/60 p-1">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`${baseId}-panel-${id}`}
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm transition',
                    tab === id ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
                  )}
                >
                  {t(`landing.preview.tabs.${id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* All panels stay mounted (hidden) so progress survives switching tabs. */}
          <div className="p-5 sm:p-8">
            {TABS.map((id) => (
              <div key={id} role="tabpanel" id={`${baseId}-panel-${id}`} aria-labelledby={`${baseId}-tab-${id}`} hidden={tab !== id}>
                {id === 'tasks' && <TaskListPreview />}
                {id === 'board' && <BoardPreview />}
                {id === 'focus' && <FocusPreview />}
              </div>
            ))}
          </div>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
