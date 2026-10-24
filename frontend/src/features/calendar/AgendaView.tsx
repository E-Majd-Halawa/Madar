import { useMemo } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CalendarItem } from '@/api/contracts';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useDirectoryStore } from '@/store/directoryStore';
import { useTaskStore } from '@/store/taskStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

interface AgendaViewProps {
  items: CalendarItem[];
}

export function AgendaView({ items }: AgendaViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);
  const directoryUsers = useDirectoryStore((s) => s.byId);

  // Group items by date string (YYYY-MM-DD)
  const grouped = useMemo(() => {
    const groups: { dateStr: string; dateObj: Date; items: CalendarItem[] }[] = [];
    const map = new Map<string, CalendarItem[]>();

    for (const item of items) {
      const dateKey = item.date.split('T')[0];
      const list = map.get(dateKey) || [];
      list.push(item);
      map.set(dateKey, list);
    }

    const sortedDates = Array.from(map.keys()).sort();
    for (const d of sortedDates) {
      groups.push({
        dateStr: d,
        dateObj: parseISO(d),
        items: map.get(d) || [],
      });
    }

    return groups;
  }, [items]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-border/30 bg-surface/20">
        <CalendarDays className="size-12 text-muted/50 mb-3" />
        <h3 className="text-base font-bold text-fg">{t('calendar.agenda.empty')}</h3>
        <p className="text-xs text-muted max-w-sm mt-1">{t('calendar.agenda.emptyBody')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {grouped.map(({ dateStr, dateObj, items: groupItems }) => {
        const isDateToday = isToday(dateObj);
        const isDateTomorrow = isTomorrow(dateObj);

        return (
          <div key={dateStr} className="space-y-3">
            {/* Date Group Heading */}
            <div className="flex items-center justify-between border-b border-border/20 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-extrabold',
                    isDateToday ? 'text-accent' : 'text-fg',
                  )}
                >
                  {isDateToday
                    ? t('calendar.today')
                    : isDateTomorrow
                      ? t('tasks.upcoming.tomorrow')
                      : format(dateObj, 'EEEE')}
                </span>
                <span className="text-xs text-muted">
                  • {format(dateObj, 'MMMM d, yyyy')}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted bg-surface-2/60 px-2 py-0.5 rounded-full">
                {groupItems.length}
              </span>
            </div>

            {/* Group Items */}
            <div className="space-y-2">
              {groupItems.map((item) => {
                const assignee = item.assigneeId ? directoryUsers[item.assigneeId] : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'task') setActiveTaskId(item.id);
                      else if (item.projectId) navigate(`/app/projects/${item.projectId}`);
                    }}
                    className={cn(
                      'group flex items-center justify-between rounded-xl border border-border/20 bg-surface/40 p-3.5 shadow-xs backdrop-blur-sm cursor-pointer transition hover:border-accent hover:bg-surface/70',
                      item.completed && 'opacity-60 bg-surface/20',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.type === 'task' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleComplete(item.id);
                          }}
                          className="text-muted hover:text-accent transition p-0.5"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="size-4 text-accent" />
                          ) : (
                            <Circle className="size-4" />
                          )}
                        </button>
                      ) : (
                        <div className="p-0.5">
                          <Flag className="size-4 text-accent" />
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
                              'text-xs sm:text-sm font-semibold text-fg truncate',
                              item.completed && 'line-through text-muted',
                            )}
                          >
                            {item.title}
                          </h4>
                        </div>
                        {item.projectName && (
                          <span className="text-[11px] text-muted block mt-0.5 truncate">
                            {item.projectName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ms-3">
                      {item.priority && (
                        <Badge
                          tone={item.priority === 'urgent' ? 'danger' : 'neutral'}
                          className="text-[10px]"
                        >
                          {t(`tasks.priorities.${item.priority}`)}
                        </Badge>
                      )}

                      {assignee && (
                        <Avatar name={assignee.fullName} size="xs" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
