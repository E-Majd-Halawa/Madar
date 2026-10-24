import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Check,
  CheckSquare,
  Clock,
  FolderKanban,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useDirectoryStore } from '@/store/directoryStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';
import { formatMinutes, isDueToday, isOverdue } from '@/utils/taskStats';

interface TaskListItemProps {
  task: Task;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  viewMode?: 'list' | 'table';
}

const PRIORITY_TONE: Record<TaskPriority, 'neutral' | 'accent' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'accent',
  high: 'warning',
  urgent: 'danger',
};

const STATUS_TONE: Record<TaskStatus, 'neutral' | 'accent' | 'warning' | 'danger'> = {
  backlog: 'neutral',
  todo: 'neutral',
  in_progress: 'accent',
  review: 'warning',
  completed: 'accent',
  archived: 'neutral',
};

export function TaskListItem({
  task,
  isSelected,
  onToggleSelect,
  viewMode = 'list',
}: TaskListItemProps) {
  const { t } = useTranslation();
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const removeTask = useTaskStore((s) => s.remove);
  const restoreTask = useTaskStore((s) => s.restore);

  const projects = useProjectStore((s) => s.projects);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const project = projects.find((p) => p.id === task.projectId);
  const assignee = task.assigneeId ? directoryUsers[task.assigneeId] : null;
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.done).length;

  const isDone = task.status === 'completed';
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleComplete(task.id);
    toast.success(isDone ? t('tasks.reopened') : t('tasks.completed'));
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const deleted = await removeTask(task.id);
    if (deleted) {
      toast.success(t('tasks.deleted'), {
        actionLabel: t('common.undo'),
        onAction: () => restoreTask(deleted),
      });
    }
  };

  const handleRowClick = () => {
    setActiveTaskId(task.id);
  };

  // TABLE VIEW VARIANT
  if (viewMode === 'table') {
    return (
      <tr
        onClick={handleRowClick}
        className={cn(
          'group border-b border-border/10 transition-colors hover:bg-surface-2/40 cursor-pointer text-xs',
          isSelected && 'bg-accent/5',
          isDone && 'opacity-65',
        )}
      >
        {/* Bulk select checkbox */}
        <td className="py-3 px-3 w-8" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(task.id)}
            className="size-4 rounded border-border/40 text-accent focus:ring-accent/20 cursor-pointer"
          />
        </td>

        {/* Completion checkbox */}
        <td className="py-3 px-2 w-8" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            role="checkbox"
            aria-checked={isDone}
            onClick={handleToggleComplete}
            className={cn(
              'grid size-5 place-items-center rounded-md border transition',
              isDone
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-border/30 hover:border-accent',
            )}
          >
            {isDone && <Check className="size-3.5" />}
          </button>
        </td>

        {/* Title & tags */}
        <td className="py-3 px-3 min-w-[200px]">
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                'font-medium text-fg group-hover:text-accent transition-colors',
                isDone && 'line-through text-muted',
              )}
            >
              {task.title}
            </span>
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                {task.tags.slice(0, 2).map((tg) => (
                  <span
                    key={tg}
                    className="text-[10px] text-muted bg-surface-2 px-1 rounded"
                  >
                    #{tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="py-3 px-3">
          <Badge tone={STATUS_TONE[task.status]}>
            {t(`tasks.statuses.${task.status}`)}
          </Badge>
        </td>

        {/* Priority */}
        <td className="py-3 px-3">
          <Badge tone={PRIORITY_TONE[task.priority]}>
            {t(`tasks.priorities.${task.priority}`)}
          </Badge>
        </td>

        {/* Project */}
        <td className="py-3 px-3 text-muted">
          {project ? (
            <span className="inline-flex items-center gap-1 truncate max-w-[120px]">
              <FolderKanban className="size-3 shrink-0" />
              {project.name}
            </span>
          ) : (
            '—'
          )}
        </td>

        {/* Due Date */}
        <td className="py-3 px-3">
          {task.dueDate ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                overdue && 'text-danger font-semibold',
                dueToday && 'text-warning font-semibold',
                !overdue && !dueToday && 'text-muted',
              )}
            >
              <Calendar className="size-3 shrink-0" />
              {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>

        {/* Subtasks */}
        <td className="py-3 px-3 text-muted">
          {subtasks.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="size-3" />
              {completedSubtasks}/{subtasks.length}
            </span>
          ) : (
            '—'
          )}
        </td>

        {/* Assignee */}
        <td className="py-3 px-3">
          {assignee ? (
            <div className="flex items-center gap-2">
              <Avatar name={assignee.fullName} size="xs" />
              <span className="truncate max-w-[100px] text-fg">{assignee.fullName.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-3 px-3 text-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleDelete}
            title={t('common.delete')}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-danger rounded-lg transition"
          >
            <Trash2 className="size-3.5" />
          </button>
        </td>
      </tr>
    );
  }

  // LIST VIEW VARIANT (Card style)
  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'group flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none',
        'bg-surface hover:bg-surface-2/40 hover:border-accent/40',
        isSelected && 'border-accent/60 bg-accent/5',
        isDone && 'opacity-65',
        !isSelected && 'border-border/15',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Bulk select checkbox */}
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(task.id)}
            className="size-4 rounded border-border/40 text-accent focus:ring-accent/20 cursor-pointer"
          />
        </div>

        {/* Completion checkbox */}
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            role="checkbox"
            aria-checked={isDone}
            onClick={handleToggleComplete}
            className={cn(
              'grid size-5 place-items-center rounded-md border transition',
              isDone
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-border/30 hover:border-accent',
            )}
          >
            {isDone && <Check className="size-3.5" />}
          </button>
        </div>

        {/* Title, description & badges */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={cn(
                'text-sm font-medium text-fg group-hover:text-accent transition-colors truncate',
                isDone && 'line-through text-muted',
              )}
            >
              {task.title}
            </h4>

            {project && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted bg-surface-2 px-2 py-0.5 rounded-md border border-border/10">
                <FolderKanban className="size-3" />
                {project.name}
              </span>
            )}

            <Badge tone={PRIORITY_TONE[task.priority]}>
              {t(`tasks.priorities.${task.priority}`)}
            </Badge>

            <Badge tone={STATUS_TONE[task.status]}>
              {t(`tasks.statuses.${task.status}`)}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-muted truncate max-w-xl">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta indicators & actions */}
      <div className="flex items-center gap-3 shrink-0 text-xs text-muted">
        {/* Due date */}
        {task.dueDate && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium text-xs',
              overdue && 'text-danger font-semibold',
              dueToday && 'text-warning font-semibold',
              !overdue && !dueToday && 'text-muted',
            )}
          >
            <Calendar className="size-3.5" />
            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* Subtask count */}
        {subtasks.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs">
            <CheckSquare className="size-3.5" />
            {completedSubtasks}/{subtasks.length}
          </span>
        )}

        {/* Time tracking */}
        {(task.trackedMinutes > 0 || (task.estimateMinutes ?? 0) > 0) && (
          <span className="inline-flex items-center gap-1 text-xs">
            <Clock className="size-3.5" />
            {formatMinutes(task.trackedMinutes)}
          </span>
        )}

        {/* Assignee */}
        {assignee && <Avatar name={assignee.fullName} size="xs" />}

        {/* Delete button */}
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleDelete}
            title={t('common.delete')}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-danger rounded-lg transition"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
