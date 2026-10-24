import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { CalendarItem } from '@/api/contracts';
import { AgendaView } from '@/features/calendar/AgendaView';
import { CalendarFilterBar } from '@/features/calendar/CalendarFilterBar';
import { CalendarHeader } from '@/features/calendar/CalendarHeader';
import { DayView } from '@/features/calendar/DayView';
import { MonthView } from '@/features/calendar/MonthView';
import { QuickTaskDateModal } from '@/features/calendar/QuickTaskDateModal';
import { WeekView } from '@/features/calendar/WeekView';
import { calendarService } from '@/services/calendarService';
import { useCalendarStore } from '@/store/calendarStore';
import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function CalendarPage() {
  const { t } = useTranslation();
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const filters = useCalendarStore((s) => s.filters);
  const viewMode = useCalendarStore((s) => s.viewMode);

  const [serviceItems, setServiceItems] = useState<CalendarItem[]>([]);

  // Fetch from calendarService when workspace or filters change
  useEffect(() => {
    if (!workspaceId) return;
    let active = true;

    void calendarService
      .getItems(workspaceId, {
        projectId: filters.projectId,
        priority: filters.priority,
        assigneeId: filters.assigneeId,
        type: filters.type,
      })
      .then((items) => {
        if (active) setServiceItems(items);
      });

    return () => {
      active = false;
    };
  }, [workspaceId, filters, tasks, projects]);

  // Reactive items: merge live store state with service items
  const calendarItems = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const items: CalendarItem[] = [];

    // 1. Tasks
    if (filters.type === 'all' || filters.type === 'task') {
      for (const task of tasks) {
        if (task.status === 'archived') continue;
        const targetDate = task.dueDate || task.startDate;
        if (!targetDate) continue;

        // Apply filters
        if (filters.projectId !== 'all' && task.projectId !== filters.projectId) continue;
        if (filters.priority !== 'all' && task.priority !== filters.priority) continue;
        if (filters.assigneeId !== 'all') {
          if (filters.assigneeId === 'unassigned' && task.assigneeId !== null) continue;
          if (filters.assigneeId !== 'unassigned' && task.assigneeId !== filters.assigneeId) continue;
        }

        const project = task.projectId ? projectMap.get(task.projectId) : undefined;
        items.push({
          id: task.id,
          type: 'task',
          title: task.title,
          date: targetDate,
          startDate: task.startDate,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          color: project ? project.color : '#3b82f6',
          projectId: task.projectId,
          projectName: project?.name,
          assigneeId: task.assigneeId,
          completed: task.status === 'completed',
          rawTask: task,
        });
      }
    }

    // 2. Projects
    if (filters.type === 'all' || filters.type === 'project') {
      for (const project of projects) {
        if (project.status === 'archived') continue;
        if (!project.dueDate) continue;

        if (filters.projectId !== 'all' && project.id !== filters.projectId) continue;

        items.push({
          id: `proj-due-${project.id}`,
          type: 'project',
          title: project.name,
          date: project.dueDate,
          startDate: project.startDate,
          dueDate: project.dueDate,
          status: project.status,
          color: project.color,
          projectId: project.id,
          projectName: project.name,
          completed: project.status === 'completed',
          rawProject: project,
        });
      }
    }

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return items;
  }, [tasks, projects, filters]);

  return (
    <div className="space-y-6">
      {/* Calendar Header with Navigation and View Switcher */}
      <CalendarHeader />

      {/* Calendar Filter Bar */}
      <CalendarFilterBar />

      {/* Interactive Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'month' && <MonthView items={calendarItems} />}
          {viewMode === 'week' && <WeekView items={calendarItems} />}
          {viewMode === 'day' && <DayView items={calendarItems} />}
          {viewMode === 'agenda' && <AgendaView items={calendarItems} />}
        </motion.div>
      </AnimatePresence>

      {/* Quick Task creation modal on specific date */}
      <QuickTaskDateModal />
    </div>
  );
}
