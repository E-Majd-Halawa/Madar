import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { KanbanCard } from './KanbanCard';
import { KanbanQuickAdd } from './KanbanQuickAdd';
import type { Task, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const COLUMN_COLORS: Record<
  TaskStatus,
  { dot: string; border: string; badge: string }
> = {
  backlog: {
    dot: 'bg-slate-400',
    border: 'border-slate-500/20',
    badge: 'bg-slate-500/15 text-slate-300',
  },
  todo: {
    dot: 'bg-sky-400',
    border: 'border-sky-500/20',
    badge: 'bg-sky-500/15 text-sky-300',
  },
  in_progress: {
    dot: 'bg-amber-400',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-300',
  },
  review: {
    dot: 'bg-purple-400',
    border: 'border-purple-500/20',
    badge: 'bg-purple-500/15 text-purple-300',
  },
  completed: {
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-300',
  },
  archived: {
    dot: 'bg-zinc-600',
    border: 'border-zinc-800/50',
    badge: 'bg-zinc-900 text-zinc-500',
  },
};

const EmptyState = React.memo(function EmptyState({ isOver, t }: { isOver: boolean; t: (key: string) => string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center text-xs text-muted transition',
        isOver
          ? 'border-accent bg-accent/5 text-accent'
          : 'border-border/20 bg-surface-2/20',
      )}
      role="status"
      aria-live="polite"
    >
      <p>{isOver ? t('tasks.kanban.emptyDrop') : t('tasks.kanban.empty')}</p>
    </div>
  );
});

EmptyState.displayName = 'KanbanColumnEmptyState';

export const KanbanColumn = React.memo(function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const { t } = useTranslation();
  const columnId = `col-${status}`;

  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: 'column', status },
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const colors = COLUMN_COLORS[status] || COLUMN_COLORS.todo;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full min-h-[500px] w-80 shrink-0 rounded-2xl border bg-surface/50 p-3.5 backdrop-blur-sm transition-colors duration-200',
        colors.border,
        isOver
          ? 'bg-surface-2/80 ring-2 ring-accent/40 border-accent/40'
          : 'hover:border-border/40',
      )}
      dir="auto"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 px-1 pb-3 mb-2 border-b border-border/10">
        <div className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', colors.dot)} aria-hidden />
          <h3 className="text-sm font-semibold text-fg tracking-tight" id={`col-${status}-header`}>
            {t(`tasks.kanban.columns.${status}`)}
          </h3>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide',
              colors.badge,
            )}
            aria-label={t('tasks.count', { count: tasks.length })}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable and Sortable card container */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-0.5 pb-2" role="list" aria-labelledby={`col-${status}-header`}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && <EmptyState isOver={isOver} t={t} />}
      </div>

      {/* Quick Add Form at Column Footer */}
      <div className="pt-2 mt-auto border-t border-border/10">
        <KanbanQuickAdd status={status} />
      </div>
    </div>
  );
});

KanbanColumn.displayName = 'KanbanColumn';