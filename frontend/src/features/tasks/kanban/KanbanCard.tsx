import React, { useMemo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderKanban,
  GripVertical,
  MessageSquare,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import type { Task, TaskPriority } from '@/types';
import { cn } from '@/utils/cn';
import { formatMinutes, isDueToday, isOverdue } from '@/utils/taskStats';

interface KanbanCardProps {
  task: Task;
  isOverlay?: boolean;
}

const PRIORITY_TONE: Record<TaskPriority, 'neutral' | 'accent' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'accent',
  high: 'warning',
  urgent: 'danger',
};

export const KanbanCard = React.memo(function KanbanCard({ task, isOverlay = false }: KanbanCardProps) {
  const { t } = useTranslation();
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled: isOverlay,
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  );

  const project = useMemo(() => projects.find((p) => p.id === task.projectId), [projects, task.projectId]);
  const assignee = useMemo(
    () => (task.assigneeId ? directoryUsers[task.assigneeId] : null),
    [directoryUsers, task.assigneeId]
  );
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.done).length;
  const isDone = task.status === 'completed';
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);

  const handleToggleDone = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await toggleComplete(task.id);
      toast.success(isDone ? t('tasks.reopened') : t('tasks.completed'));
    },
    [task.id, toggleComplete, isDone, t, toast]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      setActiveTaskId(task.id);
    },
    [isDragging, setActiveTaskId, task.id]
  );

  const cardContent = (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-xl border p-3.5 text-start cursor-pointer select-none transition-all duration-200',
        'bg-surface hover:border-accent/50 hover:shadow-md hover:bg-surface-2/40',
        isDragging && 'opacity-30 border-accent/60 scale-[0.98]',
        isOverlay && 'border-accent shadow-depth scale-105 rotate-1 bg-surface-2 ring-2 ring-accent/30',
        isDone && 'opacity-70 bg-surface/60',
        !isDragging && !isOverlay && 'border-border/20',
      )}
      dir={isOverlay ? undefined : 'auto'}
    >
      {/* Top Header: Priority badge & Project / Drag handle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Badge tone={PRIORITY_TONE[task.priority]}>
            {t(`tasks.priorities.${task.priority}`)}
          </Badge>
          {project && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted truncate max-w-[120px]">
              <FolderKanban className="size-3 shrink-0" aria-hidden />
              {project.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Quick complete button */}
          <button
            type="button"
            onClick={handleToggleDone}
            title={isDone ? t('tasks.markOpen', { title: task.title }) : t('tasks.markDone', { title: task.title })}
            className={cn(
              'p-1 rounded-md text-muted hover:text-accent transition',
              isDone && 'text-accent',
            )}
            aria-label={isDone ? t('tasks.markOpen', { title: task.title }) : t('tasks.markDone', { title: task.title })}
          >
            <CheckCircle2 className="size-4" aria-hidden />
          </button>

          {/* Grip drag handle icon on hover */}
          {!isOverlay && (
            <div
              {...attributes}
              {...listeners}
              className="p-1 text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing rounded"
              aria-label={t('tasks.kanban.dragHandle')}
              role="button"
              tabIndex={0}
            >
              <GripVertical className="size-3.5" aria-hidden />
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <div>
        <h4
          className={cn(
            'text-sm font-medium leading-snug text-fg group-hover:text-accent transition-colors line-clamp-2',
            isDone && 'line-through text-muted',
          )}
        >
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      {/* Tags preview */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap" aria-label={t('tasks.tags')}>
          {task.tags.slice(0, 3).map((tg) => (
            <span
              key={tg}
              className="text-[10px] font-medium text-muted bg-surface-2/80 px-1.5 py-0.5 rounded border border-border/10"
            >
              #{tg}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-muted">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Bottom Footer: Due Date, Subtasks, Comments, Time, Assignee */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/10 text-xs text-muted">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium text-[11px]',
                overdue && 'text-danger font-semibold',
                dueToday && 'text-warning font-semibold',
                !overdue && !dueToday && 'text-muted',
              )}
              aria-label={overdue
                ? t('tasks.dueOverdue', { date: new Date(task.dueDate).toLocaleDateString() })
                : dueToday
                ? t('tasks.dueToday', { date: new Date(task.dueDate).toLocaleDateString() })
                : t('tasks.dueDateLabel', { date: new Date(task.dueDate).toLocaleDateString() })}
            >
              <Calendar className="size-3" aria-hidden />
              {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          )}

          {/* Subtasks checklist progress */}
          {subtasks.length > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px]',
                completedSubtasks === subtasks.length ? 'text-accent font-semibold' : 'text-muted',
              )}
              aria-label={t('tasks.subtasksProgress', { done: completedSubtasks, total: subtasks.length })}
            >
              <CheckSquare className="size-3" aria-hidden />
              {completedSubtasks}/{subtasks.length}
            </span>
          )}

          {/* Comments count */}
          {task.comments && task.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted" aria-label={t('tasks.commentsCount', { count: task.comments.length })}>
              <MessageSquare className="size-3" aria-hidden />
              {task.comments.length}
            </span>
          )}

          {/* Tracked time */}
          {(task.trackedMinutes > 0 || (task.estimateMinutes ?? 0) > 0) && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted" aria-label={t('tasks.trackedTime', { time: formatMinutes(task.trackedMinutes) })}>
              <Clock className="size-3" aria-hidden />
              {formatMinutes(task.trackedMinutes)}
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {assignee ? (
          <Avatar name={assignee.fullName} size="xs" aria-label={t('tasks.assignedTo', { name: assignee.fullName })} />
        ) : (
          <div
            className="size-6 rounded-full border border-dashed border-border/40 grid place-items-center text-[10px] text-muted/60"
            title={t('tasks.drawer.unassigned')}
            aria-label={t('tasks.unassigned')}
          >
            ?
          </div>
        )}
      </div>
    </div>
  );

  if (isOverlay) {
    return cardContent;
  }

  return <div ref={setNodeRef} style={style}>{cardContent}</div>;
});

KanbanCard.displayName = 'KanbanCard';