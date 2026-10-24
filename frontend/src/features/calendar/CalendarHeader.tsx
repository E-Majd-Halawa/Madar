import { format } from 'date-fns';
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Plus,
  Sun,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useCalendarStore, type CalendarViewMode } from '@/store/calendarStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export function CalendarHeader() {
  const { t } = useTranslation();
  const currentDate = useCalendarStore((s) => s.currentDate);
  const viewMode = useCalendarStore((s) => s.viewMode);
  const setViewMode = useCalendarStore((s) => s.setViewMode);
  const nextPeriod = useCalendarStore((s) => s.nextPeriod);
  const prevPeriod = useCalendarStore((s) => s.prevPeriod);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const setTaskModal = useUiStore((s) => s.setTaskModal);

  // Formatted date title
  const dateTitle = (() => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'agenda':
        return format(currentDate, 'MMMM yyyy');
    }
  })();

  const VIEWS: { mode: CalendarViewMode; label: string; icon: typeof CalendarDays }[] = [
    { mode: 'month', label: t('calendar.views.month'), icon: CalendarDays },
    { mode: 'week', label: t('calendar.views.week'), icon: CalendarRange },
    { mode: 'day', label: t('calendar.views.day'), icon: Sun },
    { mode: 'agenda', label: t('calendar.views.agenda'), icon: ListOrdered },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Date Navigation & Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-fg capitalize min-w-[200px]">
          {dateTitle}
        </h1>

        <div className="flex items-center gap-1 rounded-xl border border-border/20 bg-surface-2/60 p-1">
          <button
            type="button"
            onClick={prevPeriod}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-muted hover:bg-surface hover:text-fg transition"
          >
            {t('calendar.today')}
          </button>
          <button
            type="button"
            onClick={nextPeriod}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-fg transition"
            aria-label="Next"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* View Mode Switcher & New Task */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl border border-border/20 bg-surface-2/60 p-1">
          {VIEWS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                viewMode === mode
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-muted hover:text-fg',
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <Button variant="primary" size="sm" onClick={() => setTaskModal(true)}>
          <Plus className="size-4 me-1.5" />
          <span className="text-xs">{t('tasks.new')}</span>
        </Button>
      </div>
    </div>
  );
}
