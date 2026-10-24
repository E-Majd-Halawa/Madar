import { useTranslation } from 'react-i18next';
import { useTaskStore } from '@/store/taskStore';
import { formatDuration } from './formatDuration';

interface TasksDockProps {
  newlyAddedCount?: number;
}

export function TasksDock({ newlyAddedCount = 0 }: TasksDockProps) {
  const { t, i18n } = useTranslation();
  const tasks = useTaskStore((s) => s.tasks);

  const todayTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 8);
  const totalMins = todayTasks.reduce((acc, curr) => acc + (curr.estimateMinutes || 25), 0);

  return (
    <aside
      className="sticky top-4 border border-border/30 rounded-3xl bg-surface/80 p-5 backdrop-blur-xl shadow-xl"
      aria-label="My tasks today"
    >
      <h3 className="m-0 font-display text-lg font-bold text-text">
        {t('ai.dockTitle', 'My tasks · Today')}
      </h3>
      <p className="mt-1 mb-4 text-xs text-text-muted">
        {t('ai.dockMeta', { count: todayTasks.length, time: formatDuration(totalMins, i18n.language) })}
      </p>
      <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
        {todayTasks.length === 0 ? (
          <li className="p-3 rounded-xl border border-border/20 bg-white/[0.02] text-xs text-text-muted text-center">
            {t('ai.noActiveTasks', 'No active tasks today. Ask AI to plan your day!')}
          </li>
        ) : (
          todayTasks.map((task, idx) => {
            const isNew = newlyAddedCount > 0 && idx >= todayTasks.length - newlyAddedCount;
            return (
              <li
                key={task.id}
                className={`flex justify-between items-center gap-3 p-3 rounded-xl border transition-all ${
                  isNew
                    ? 'border-accent bg-accent/10 animate-[land_.8s_cubic-bezier(.2,.8,.2,1)_both]'
                    : 'border-border/20 bg-white/[0.03]'
                }`}
                style={isNew ? { animationDelay: `${(idx - (todayTasks.length - newlyAddedCount)) * 120}ms` } : undefined}
              >
                <span className="text-sm font-medium text-text truncate">{task.title}</span>
                <small className={`whitespace-nowrap text-xs ${isNew ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                  {task.tags?.includes('ai-plan') ? 'AI · ' : ''}
                  {formatDuration(task.estimateMinutes || 25, i18n.language)}
                </small>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
