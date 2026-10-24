import type { CalendarFilter, CalendarItem, CalendarService } from '@/api/contracts';
import { mockProjectService } from './mockProjectService';
import { mockTaskService } from './mockTaskService';
import { delay } from './delay';

export const mockCalendarService: CalendarService = {
  async getItems(workspaceId: string, filter?: CalendarFilter): Promise<CalendarItem[]> {
    await delay(120);

    const [tasks, projects] = await Promise.all([
      mockTaskService.listByWorkspace(workspaceId),
      mockProjectService.listByWorkspace(workspaceId),
    ]);

    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const items: CalendarItem[] = [];

    // 1. Task calendar items
    for (const task of tasks) {
      if (task.status === 'archived') continue;
      const targetDate = task.dueDate || task.startDate;
      if (!targetDate) continue;

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

    // 2. Project deadline / milestone calendar items
    for (const project of projects) {
      if (project.status === 'archived') continue;
      if (project.dueDate) {
        items.push({
          id: `proj-due-${project.id}`,
          type: 'project',
          title: `🏁 ${project.name} (Deadline)`,
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

    // Apply filters
    let result = items;

    if (filter?.projectId && filter.projectId !== 'all') {
      result = result.filter((item) => item.projectId === filter.projectId);
    }

    if (filter?.priority && filter.priority !== 'all') {
      result = result.filter((item) => item.priority === filter.priority);
    }

    if (filter?.assigneeId && filter.assigneeId !== 'all') {
      if (filter.assigneeId === 'unassigned') {
        result = result.filter((item) => !item.assigneeId);
      } else {
        result = result.filter((item) => item.assigneeId === filter.assigneeId);
      }
    }

    if (filter?.type && filter.type !== 'all') {
      result = result.filter((item) => item.type === filter.type);
    }

    // Sort by date ascending
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result;
  },
};
