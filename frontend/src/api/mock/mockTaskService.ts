import type { TaskService } from '@/api/contracts';
import { SEED_TASKS } from '@/data/tasks';
import type { Task } from '@/types';
import { createCollection, newId } from './collection';
import { delay } from './delay';

const table = createCollection<Task>('mock.tasks', SEED_TASKS);

export const mockTaskService: TaskService = {
  async listByWorkspace(workspaceId) {
    await delay(200);
    return table.read().filter((t) => t.workspaceId === workspaceId);
  },

  async create({ workspaceId, title, creatorId, ...rest }) {
    await delay(120);
    const now = new Date().toISOString();
    const task: Task = {
      id: newId('tsk'),
      workspaceId,
      projectId: null,
      title,
      description: '',
      status: 'todo',
      priority: 'medium',
      category: 'General',
      startDate: null,
      dueDate: null,
      assigneeId: creatorId,
      creatorId,
      tags: [],
      subtasks: [],
      estimateMinutes: null,
      trackedMinutes: 0,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      ...rest,
    };
    table.write([task, ...table.read()]);
    return task;
  },

  async update(id, patch) {
    await delay(80);
    const items = table.read();
    const current = items.find((t) => t.id === id);
    if (!current) throw new Error('Task not found');
    const next: Task = { ...current, ...patch, updatedAt: new Date().toISOString() };
    table.write(items.map((t) => (t.id === id ? next : t)));
    return next;
  },

  async remove(id) {
    await delay(80);
    table.write(table.read().filter((t) => t.id !== id));
  },

  async restore(task) {
    table.write([task, ...table.read().filter((t) => t.id !== task.id)]);
  },
};
