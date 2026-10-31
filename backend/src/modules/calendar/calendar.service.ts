import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service.js';
import { TasksService } from '../tasks/tasks.service.js';

@Injectable()
export class CalendarService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly tasks: TasksService,
  ) {}

  async getItems(workspaceId: string, userId: string, filter: any = {}) {
    const [tasks, projects] = await Promise.all([
      this.tasks.listByWorkspace(workspaceId, userId, {}),
      this.projects.list(workspaceId, userId),
    ]);

    const projectMap = new Map(projects.map((p: any) => [p.id, p]));
    const items: any[] = [];

    for (const task of tasks) {
      if (task.status === 'archived') continue;
      const targetDate = task.dueDate || task.startDate;
      if (!targetDate) continue;
      const project = task.projectId
        ? projectMap.get(task.projectId)
        : undefined;

      items.push({
        id: task.id,
        type: 'task',
        title: task.title,
        date: targetDate as string,
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

    for (const project of projects) {
      if (project.status === 'archived') continue;
      if (project.dueDate) {
        items.push({
          id: `proj-due-${project.id}`,
          type: 'project',
          title: `${project.name} (Deadline)`,
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

    let result = items;
    if (filter?.projectId && filter.projectId !== 'all')
      result = result.filter((i) => i.projectId === filter.projectId);
    if (filter?.priority && filter.priority !== 'all')
      result = result.filter((i) => i.priority === filter.priority);
    if (filter?.assigneeId && filter.assigneeId !== 'all') {
      if (filter.assigneeId === 'unassigned')
        result = result.filter((i) => !i.assigneeId);
      else result = result.filter((i) => i.assigneeId === filter.assigneeId);
    }
    if (filter?.type && filter.type !== 'all')
      result = result.filter((i) => i.type === filter.type);
    if (filter?.month && filter?.year) {
      result = result.filter((i) => {
        const d = new Date(i.date);
        return (
          d.getUTCMonth() + 1 === Number(filter.month) &&
          d.getUTCFullYear() === Number(filter.year)
        );
      });
    }
    result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return result;
  }
}
