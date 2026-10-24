import { useMemo } from 'react';
import { addDays, format, isSameDay, isToday, startOfWeek } from 'date-fns';
import { Clock, Flag, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CalendarItem } from '@/api/contracts';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useCalendarStore } from '@/store/calendarStore';
import { useDirectoryStore } from '@/store/directoryStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

interface WeekViewProps {
  items: CalendarItem[];
}

export function WeekView({ items }: WeekViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setQuickAddDate = useCalendarStore((s) => s.setQuickAddDate);
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  // 7 days of current week
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Group items by YYYY-MM-DD
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const dateKey = item.date.split('T')[0];
      const list = map.get(dateKey) || [];
      list.push(item);
      map.set(dateKey, list);
    }
    return map;
  }, [items]);

  const handleItemClick = (item: CalendarItem) => {
    if (item.type === 'task') {
      setActiveTaskId(item.id);
    } else if (item.projectId) {
      navigate(`/app/projects/${item.projectId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {weekDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayItems = itemsByDate.get(dateStr) || [];
        const isDayToday = isToday(day);

        return (
          <div
            key={dateStr}
            className={cn(
              'flex flex-col rounded-2xl border border-border/20 bg-surface/40 p-3 min-h-[360px] backdrop-blur-sm transition',
              isDayToday && 'border-accent/40 bg-accent/5 ring-1 ring-accent/30',
            )}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between border-b border-border/10 pb-2 mb-3">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase block">
                  {format(day, 'EEE')}
                </span>
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs font-extrabold mt-0.5',
                    isDayToday ? 'bg-accent text-accent-fg' : 'text-fg',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuickAddDate(dateStr)}
                className="size-6 rounded-lg text-muted hover:bg-accent hover:text-accent-fg flex items-center justify-center transition"
                title={t('tasks.new')}
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Event Cards */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[480px] scrollbar-thin">
              {dayItems.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-center text-[11px] text-muted/60">
                  {t('dashboard.empty.upcoming')}
                </div>
              ) : (
                dayItems.map((item) => {
                  const assignee = item.assigneeId ? directoryUsers[item.assigneeId] : null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'group flex flex-col justify-between rounded-xl border border-border/20 bg-surface p-2.5 shadow-xs cursor-pointer transition hover:border-accent hover:shadow-sm',
                        item.completed && 'opacity-60',
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.type === 'project' ? (
                            <Flag className="size-3 shrink-0 text-accent" />
                          ) : (
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          )}
                          <h4
                            className={cn(
                              'text-xs font-semibold text-fg truncate',
                              item.completed && 'line-through text-muted',
                            )}
                          >
                            {item.title}
                          </h4>
                        </div>

                        {item.priority && (
                          <Badge tone={item.priority === 'urgent' ? 'danger' : 'neutral'} className="text-[9px] px-1.5 py-0">
                            {t(`tasks.priorities.${item.priority}`)}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted border-t border-border/10 pt-1.5">
                        <span className="truncate max-w-[90px]">{item.projectName || 'Task'}</span>
                        {assignee && (
                          <Avatar name={assignee.fullName} size="xs" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
