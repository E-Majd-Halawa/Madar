import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import type { Task, TaskPriority } from '@/types';
import { cn } from '@/utils/cn';
import { daysUntil, isOverdue } from '@/utils/taskStats';

const TONE: Record<TaskPriority, 'neutral' | 'accent' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'accent',
  high: 'warning',
  urgent: 'danger',
};

export function useDueLabel() {
  const { t } = useTranslation();
  return (task: Task): string => {
    if (!task.dueDate) return t('dashboard.noDate');
    const d = daysUntil(task.dueDate);
    if (d < 0) return t('dashboard.overdueBy', { count: -d });
    if (d === 0) return t('dashboard.dueToday');
    if (d === 1) return t('dashboard.dueTomorrow');
    return t('dashboard.dueIn', { count: d });
  };
}

/** A single task line with a real completion checkbox that updates stats everywhere. */
export function TaskRow({ task }: { task: Task }) {
  const { t } = useTranslation();
  const dueLabel = useDueLabel();
  const toggle = useTaskStore((s) => s.toggleComplete);
  const done = task.status === 'completed';

  const onToggle = async () => {
    await toggle(task.id);
    toast.success(done ? t('tasks.reopened') : t('tasks.completed'));
  };

  return (
    <li className="flex items-center gap-3 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={t(done ? 'tasks.markOpen' : 'tasks.markDone', { title: task.title })}
        onClick={() => void onToggle()}
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-md border transition',
          done ? 'border-accent bg-accent text-accent-fg' : 'border-border/30 hover:border-accent',
        )}
      >
        {done && <Check className="size-3.5" aria-hidden />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', done && 'text-muted line-through')}>{task.title}</p>
        <p className={cn('text-xs', isOverdue(task) ? 'text-danger' : 'text-muted')}>{dueLabel(task)}</p>
      </div>
      <Badge tone={TONE[task.priority]}>{t(`tasks.priorities.${task.priority}`)}</Badge>
    </li>
  );
}
