import { useMemo } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Flag, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { CalendarItem } from '@/api/contracts';
import { useCalendarStore } from '@/store/calendarStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

interface MonthViewProps {
  items: CalendarItem[];
}

export function MonthView({ items }: MonthViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentDate = useCalendarStore((s) => s.currentDate);
  const setQuickAddDate = useCalendarStore((s) => s.setQuickAddDate);
  const setActiveTaskId = useUiStore((s) => s.setActiveTaskId);

  // Calculate days for current month grid (including leading/trailing overflow)
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calStart, end: calEnd });
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

  // Weekday names
  const weekdays = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }).map((_, i) => {
      return {
        key: String(i),
        label: format(new Date(weekStart.getTime() + i * 86400000), 'EEE'),
      };
    });
  }, []);

  const handleItemClick = (e: React.MouseEvent, item: CalendarItem) => {
    e.stopPropagation();
    if (item.type === 'task') {
      setActiveTaskId(item.id);
    } else if (item.projectId) {
      navigate(`/app/projects/${item.projectId}`);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/20 bg-surface/40 backdrop-blur-sm shadow-sm">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-border/20 bg-surface-2/40 text-center text-xs font-bold text-muted py-2.5">
        {weekdays.map((wd) => (
          <div key={wd.key} className="uppercase tracking-wider">
            {wd.label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border/15">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(dateStr) || [];
          const isCurrMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={dateStr}
              onClick={() => setQuickAddDate(dateStr)}
              className={cn(
                'group relative min-h-[110px] p-2 transition hover:bg-surface-2/30 cursor-pointer flex flex-col justify-between',
                !isCurrMonth && 'bg-surface-2/10 opacity-40',
              )}
            >
              {/* Day Header (Number + Quick Add on Hover) */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs font-bold transition',
                    isDayToday
                      ? 'bg-accent text-accent-fg shadow-sm'
                      : isCurrMonth
                        ? 'text-fg'
                        : 'text-muted',
                  )}
                >
                  {format(day, 'd')}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickAddDate(dateStr);
                  }}
                  className="size-5 rounded-md text-muted hover:bg-accent hover:text-accent-fg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  title={t('tasks.new')}
                >
                  <Plus className="size-3" />
                </button>
              </div>

              {/* Event Chips List */}
              <div className="mt-1.5 space-y-1 flex-1">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => handleItemClick(e, item)}
                    className={cn(
                      'w-full text-start flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition truncate shadow-xs',
                      item.type === 'project'
                        ? 'bg-accent/15 text-accent font-semibold hover:bg-accent/25'
                        : item.completed
                          ? 'bg-surface-2/60 text-muted line-through hover:bg-surface-2'
                          : 'bg-surface border border-border/30 text-fg hover:border-accent',
                    )}
                    title={`${item.title} (${item.projectName || 'General'})`}
                  >
                    {item.type === 'project' ? (
                      <Flag className="size-2.5 shrink-0 text-accent" />
                    ) : (
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}

                {dayItems.length > 3 && (
                  <span className="block text-[10px] font-semibold text-muted ps-1">
                    {t('calendar.moreEvents', { count: dayItems.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
