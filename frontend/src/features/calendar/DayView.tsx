import { useMemo, useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CalendarItem } from '@/api/contracts';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/utils/cn';

interface DayViewProps {
  items: CalendarItem[];
}

export function DayView({ items }: DayViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentDate = useCalendarStore((s) => s.currentDate);
  const user = useAuthStore((s) => s.session?.user);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const createTask = useTaskStore((s) => s.create);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  const [quickTitle, setQuickTitle] = useState('');

  const dateStr = format(currentDate, 'yyyy-MM-dd');

  // Filter items matching current date
  const dayItems = useMemo(() => {
    return items.filter((item) => item.date.startsWith(dateStr));
  }, [items, dateStr]);

  const completedCount = dayItems.filter((i) => i.completed).length;
  const totalCount = dayItems.length;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !user || !workspaceId) return;

    const task = await createTask(
      {
        workspaceId,
        creatorId: user.id,
        title: quickTitle.trim(),
        priority: 'medium',
        dueDate: new Date(`${dateStr}T17:00:00`).toISOString(),
      },
      user.id,
    );

    if (task) {
      toast.success(t('tasks.created'));
      setQuickTitle('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Date Header & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/20 bg-surface/50 p-5 backdrop-blur-sm">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-wider block">
            {format(currentDate, 'EEEE')}
          </span>
          <h2 className="text-xl font-extrabold text-fg mt-0.5">
            {format(currentDate, 'MMMM d, yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-xl bg-surface-2/60 px-3 py-1.5 border border-border/10">
            <span className="text-muted font-medium">{t('projects.workspace.overview.stats.tasksTotal')}: </span>
            <strong className="text-fg">{totalCount}</strong>
          </div>
          <div className="rounded-xl bg-surface-2/60 px-3 py-1.5 border border-border/10">
            <span className="text-muted font-medium">{t('projects.workspace.overview.stats.completed')}: </span>
            <strong className="text-accent">{completedCount}</strong>
          </div>
        </div>
      </div>

      {/* Quick Add for this day */}
      <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder={t('tasks.today.quickAdd')}
          className="flex-1 rounded-xl border border-border/20 bg-surface/60 px-4 py-2.5 text-xs text-fg placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none transition shadow-sm"
        />
        <Button type="submit" variant="primary" size="sm" disabled={!quickTitle.trim()}>
          <Plus className="size-4 me-1.5" />
          <span>{t('tasks.create')}</span>
        </Button>
      </form>

      {/* Items List */}
      {dayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-border/30 bg-surface/20">
          <Clock className="size-10 text-muted/50 mb-3" />
          <h3 className="text-base font-bold text-fg">{t('dashboard.empty.today')}</h3>
          <p className="text-xs text-muted mt-1 max-w-sm">{t('dashboard.empty.todayBody')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayItems.map((item) => {
            const assignee = item.assigneeId ? directoryUsers[item.assigneeId] : null;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'task') setActiveTaskId(item.id);
                  else if (item.projectId) navigate(`/app/projects/${item.projectId}`);
                }}
                className={cn(
                  'group flex items-center justify-between rounded-2xl border border-border/20 bg-surface/50 p-4 shadow-sm backdrop-blur-sm cursor-pointer transition hover:border-accent hover:bg-surface/80',
                  item.completed && 'opacity-60 bg-surface/30',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Complete Checkbox for tasks */}
                  {item.type === 'task' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleComplete(item.id);
                      }}
                      className="text-muted hover:text-accent transition p-1"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="size-5 text-accent" />
                      ) : (
                        <Circle className="size-5" />
                      )}
                    </button>
                  ) : (
                    <div className="p-1">
                      <Flag className="size-5 text-accent" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <h4
                        className={cn(
                          'text-sm font-bold text-fg truncate',
                          item.completed && 'line-through text-muted',
                        )}
                      >
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      {item.projectName && (
                        <span>{item.projectName}</span>
                      )}
                      {item.dueDate && (
                        <span>
                          {format(parseISO(item.dueDate), 'h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.priority && (
                    <Badge
                      tone={item.priority === 'urgent' ? 'danger' : 'neutral'}
                      className="text-xs font-semibold"
                    >
                      {t(`tasks.priorities.${item.priority}`)}
                    </Badge>
                  )}

                  {assignee && (
                    <div className="flex items-center gap-1.5 text-xs text-muted" title={assignee.fullName}>
                      <Avatar name={assignee.fullName} size="xs" />
                      <span className="hidden sm:inline">{assignee.fullName}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
