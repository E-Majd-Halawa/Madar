import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TaskListItem } from '@/features/tasks/TaskListItem';
import { TaskBulkBar } from '@/features/tasks/TaskBulkBar';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Task } from '@/types';
import { isDueToday, isOverdue } from '@/utils/taskStats';

export default function TodayPage() {
  const { t, i18n } = useTranslation();
  const currentUser = useAuthStore((s) => s.session?.user);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const tasks = useTaskStore((s) => s.tasks);
  const createTask = useTaskStore((s) => s.create);

  const [search, setSearch] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatted date string
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [i18n.language]);

  // Tasks due today or overdue
  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status === 'archived') return false;
      const dueToday = isDueToday(task);
      const overdue = isOverdue(task);
      const completedToday =
        task.status === 'completed' &&
        task.dueDate &&
        new Date(task.dueDate).toDateString() === new Date().toDateString();

      if (!dueToday && !overdue && !completedToday) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, search]);

  const overdueList = useMemo(() => todayTasks.filter((t) => isOverdue(t)), [todayTasks]);
  const dueTodayList = useMemo(
    () => todayTasks.filter((t) => t.status !== 'completed' && !isOverdue(t) && isDueToday(t)),
    [todayTasks],
  );
  const completedTodayList = useMemo(
    () => todayTasks.filter((t) => t.status === 'completed'),
    [todayTasks],
  );

  const totalToday = dueTodayList.length + completedTodayList.length;
  const doneToday = completedTodayList.length;
  const pct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed || !currentUser || !activeWorkspaceId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const todayIso = new Date();
      todayIso.setHours(17, 0, 0, 0);

      const task = await createTask(
        {
          workspaceId: activeWorkspaceId,
          creatorId: currentUser.id,
          title: trimmed,
          status: 'todo',
          priority: 'medium',
          dueDate: todayIso.toISOString(),
          assigneeId: currentUser.id,
        },
        currentUser.id,
      );

      if (task) {
        toast.success(t('tasks.created'));
        setQuickTitle('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress Card */}
      <header className="rounded-2xl border border-border/20 bg-surface/50 p-6 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
              <Calendar className="size-3.5" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-fg mt-1">
              {t('tasks.today.title')}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {t('tasks.today.subtitle')}
            </p>
          </div>

          {totalToday > 0 && (
            <div className="flex items-center gap-3 bg-surface-2/60 border border-border/20 px-4 py-2.5 rounded-xl">
              <CheckCircle2 className="size-5 text-accent" />
              <div>
                <span className="text-xs font-medium text-muted block">
                  {t('tasks.today.progress', { done: doneToday, total: totalToday, pct })}
                </span>
                <ProgressBar value={pct} label="Today's progress" className="w-36 h-1.5 mt-1.5" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Add For Today form */}
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <Plus className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={t('tasks.today.quickAdd')}
              className="w-full rounded-xl bg-surface-2/80 border border-border/30 py-2.5 ps-10 pe-4 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none transition"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={!quickTitle.trim() || isSubmitting}>
            {t('common.create')}
          </Button>
        </form>
      </header>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('tasks.filter.search')}
          className="w-full rounded-xl bg-surface/50 border border-border/20 py-2 ps-9 pe-8 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted hover:text-fg"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Task Sections */}
      <div className="space-y-6">
        {/* Overdue Section */}
        {overdueList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle className="size-4 text-danger" />
              <h2 className="text-sm font-semibold text-danger">
                {t('tasks.today.overdueSection')} ({overdueList.length})
              </h2>
            </div>
            <div className="space-y-2">
              {overdueList.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isSelected={selectedIds.includes(task.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Due Today Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="size-4 text-accent" />
            <h2 className="text-sm font-semibold text-fg">
              {t('tasks.today.todaySection')} ({dueTodayList.length})
            </h2>
          </div>
          {dueTodayList.length > 0 ? (
            <div className="space-y-2">
              {dueTodayList.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isSelected={selectedIds.includes(task.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/20 bg-surface/30 p-8 text-center">
              <Sparkles className="size-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-fg font-medium">{t('tasks.today.empty')}</p>
              <p className="text-xs text-muted mt-0.5">{t('tasks.today.emptyBody')}</p>
            </div>
          )}
        </div>

        {/* Completed Today Section */}
        {completedTodayList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CheckCircle2 className="size-4 text-accent" />
              <h2 className="text-sm font-semibold text-muted">
                {t('tasks.today.completedSection')} ({completedTodayList.length})
              </h2>
            </div>
            <div className="space-y-2">
              {completedTodayList.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isSelected={selectedIds.includes(task.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bulk action toolbar */}
      <TaskBulkBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
}
