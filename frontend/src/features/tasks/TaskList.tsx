import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskBulkBar } from './TaskBulkBar';
import { TaskListItem } from './TaskListItem';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  viewMode?: 'list' | 'table';
  emptyTitle?: string;
  emptyBody?: string;
}

export function TaskList({
  tasks,
  viewMode = 'list',
  emptyTitle,
  emptyBody,
}: TaskListProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < tasks.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Inbox}
          title={emptyTitle || t('tasks.filter.noResults')}
          body={emptyBody || t('tasks.filter.noResultsBody')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Table view */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-border/20 bg-surface/50 backdrop-blur-sm shadow-sm">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-border/15 bg-surface-2/40 text-[11px] font-semibold text-muted uppercase tracking-wider">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all tasks"
                    className="size-4 rounded border-border/40 text-accent focus:ring-accent/20 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-8" />
                <th className="py-3 px-3 text-start">{t('tasks.title')}</th>
                <th className="py-3 px-3 text-start">{t('tasks.statuses.todo')}</th>
                <th className="py-3 px-3 text-start">{t('tasks.priority')}</th>
                <th className="py-3 px-3 text-start">{t('tasks.project')}</th>
                <th className="py-3 px-3 text-start">{t('tasks.dueDate')}</th>
                <th className="py-3 px-3 text-start">{t('tasks.drawer.subtasks')}</th>
                <th className="py-3 px-3 text-start">{t('tasks.drawer.assignee')}</th>
                <th className="py-3 px-3 text-end" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isSelected={selectedIds.includes(task.id)}
                  onToggleSelect={handleToggleSelectOne}
                  viewMode="table"
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {/* Header select-all bar */}
          <div className="flex items-center justify-between px-3 py-1.5 text-xs text-muted">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleToggleSelectAll}
                className="size-4 rounded border-border/40 text-accent focus:ring-accent/20 cursor-pointer"
              />
              <span className="font-medium text-xs">
                {selectedIds.length > 0
                  ? t('tasks.bulk.selected', { count: selectedIds.length })
                  : `${tasks.length} tasks`}
              </span>
            </label>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                isSelected={selectedIds.includes(task.id)}
                onToggleSelect={handleToggleSelectOne}
                viewMode="list"
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <TaskBulkBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
}
