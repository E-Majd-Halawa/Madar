import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from 'date-fns';
import { create } from 'zustand';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarStoreFilters {
  projectId: string;
  priority: string;
  assigneeId: string;
  type: 'all' | 'task' | 'project';
}

interface CalendarState {
  currentDate: Date;
  viewMode: CalendarViewMode;
  filters: CalendarStoreFilters;
  quickAddDate: string | null;
  setViewMode: (viewMode: CalendarViewMode) => void;
  setCurrentDate: (date: Date) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  goToToday: () => void;
  setFilters: (filters: Partial<CalendarStoreFilters>) => void;
  resetFilters: () => void;
  setQuickAddDate: (date: string | null) => void;
}

const DEFAULT_FILTERS: CalendarStoreFilters = {
  projectId: 'all',
  priority: 'all',
  assigneeId: 'all',
  type: 'all',
};

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  currentDate: new Date(),
  viewMode: 'month',
  filters: DEFAULT_FILTERS,
  quickAddDate: null,

  setViewMode: (viewMode) => set({ viewMode }),
  setCurrentDate: (currentDate) => set({ currentDate }),

  nextPeriod: () => {
    const { currentDate, viewMode } = get();
    if (viewMode === 'month') set({ currentDate: addMonths(currentDate, 1) });
    else if (viewMode === 'week') set({ currentDate: addWeeks(currentDate, 1) });
    else set({ currentDate: addDays(currentDate, 1) });
  },

  prevPeriod: () => {
    const { currentDate, viewMode } = get();
    if (viewMode === 'month') set({ currentDate: subMonths(currentDate, 1) });
    else if (viewMode === 'week') set({ currentDate: subWeeks(currentDate, 1) });
    else set({ currentDate: subDays(currentDate, 1) });
  },

  goToToday: () => set({ currentDate: new Date() }),

  setFilters: (newFilters) =>
    set((s) => ({
      filters: { ...s.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setQuickAddDate: (quickAddDate) => set({ quickAddDate }),
}));
