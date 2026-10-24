import { Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

const INITIAL = [
  { key: 'a', done: true },
  { key: 'b', done: false },
  { key: 'c', done: false },
  { key: 'd', done: false },
  { key: 'e', done: false },
];

export function TaskListPreview() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState(INITIAL);
  const done = tasks.filter((task) => task.done).length;

  const toggle = (key: string) =>
    setTasks((list) => list.map((task) => (task.key === key ? { ...task, done: !task.done } : task)));

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h3 className="text-lg font-semibold">{t('landing.preview.tasks.heading')}</h3>
        <p className="text-sm text-muted" aria-live="polite">
          {t('landing.preview.tasks.progress', { done, total: tasks.length })}
        </p>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${(done / tasks.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-surface-2/40 px-4 py-3 transition hover:border-border/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
              <input type="checkbox" checked={task.done} onChange={() => toggle(task.key)} className="sr-only" />
              <span
                aria-hidden
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full border transition',
                  task.done ? 'border-accent bg-accent text-accent-fg' : 'border-border/40',
                )}
              >
                {task.done && <Check className="size-3.5" />}
              </span>
              <span className={cn('text-sm transition', task.done && 'text-muted line-through')}>
                {t(`landing.preview.tasks.items.${task.key}`)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
