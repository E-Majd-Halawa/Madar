import { create } from 'zustand';
import { addDays, addWeeks, addMonths, parseISO } from 'date-fns';
import type { NewTaskInput } from '@/api/contracts';
import { activityService } from '@/services/activityService';
import { notificationService } from '@/services/notificationService';
import { taskService } from '@/services/taskService';
import type { Task, TaskPatch, TaskStatus } from '@/types';
import { useNotificationStore } from './notificationStore';

interface TaskState {
  workspaceId: string | null;
  tasks: Task[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  load: (workspaceId: string) => Promise<void>;
  create: (input: NewTaskInput, actorId: string) => Promise<Task | null>;
  update: (id: string, patch: TaskPatch) => Promise<void>;
  setStatus: (id: string, status: TaskStatus, actorName?: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  moveTask: (id: string, status: TaskStatus, targetIndex?: number) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: TaskStatus) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  removeSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addComment: (taskId: string, authorId: string, content: string) => Promise<void>;
  logTime: (taskId: string, minutes: number) => Promise<void>;
  remove: (id: string) => Promise<Task | null>;
  restore: (task: Task) => void;
  reset: () => void;
}

export const useTaskStore = create<TaskState>()((set, get) => {
  /** Optimistic: the UI changes first, then the service confirms (or the change is rolled back). */
  const apply = async (id: string, patch: TaskPatch) => {
    const before = get().tasks;
    set({ tasks: before.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)) });
    try {
      await taskService.update(id, patch);
    } catch {
      set({ tasks: before });
    }
  };

  const handleRecurrence = async (task: Task) => {
    if (!task.recurrence || task.recurrence === 'none') return;
    let nextDueDate: string | null = null;
    const due = task.dueDate ? parseISO(task.dueDate) : new Date();
    if (task.recurrence === 'daily') nextDueDate = addDays(due, 1).toISOString();
    else if (task.recurrence === 'weekly') nextDueDate = addWeeks(due, 1).toISOString();
    else if (task.recurrence === 'monthly') nextDueDate = addMonths(due, 1).toISOString();

    await get().create(
      {
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        category: task.category,
        startDate: null,
        dueDate: nextDueDate,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
        tags: task.tags,
        subtasks: task.subtasks.map((st) => ({ ...st, done: false })),
        estimateMinutes: task.estimateMinutes,
        trackedMinutes: 0,
        recurrence: task.recurrence,
      },
      task.creatorId,
    );
  };

  return {
    workspaceId: null,
    tasks: [],
    status: 'idle',

    load: async (workspaceId) => {
      set({ status: 'loading', workspaceId });
      try {
        set({ tasks: await taskService.listByWorkspace(workspaceId), status: 'ready' });
      } catch {
        set({ status: 'error' });
      }
    },

    create: async (input, actorId) => {
      try {
        const task = await taskService.create(input);
        set((s) => ({ tasks: [task, ...s.tasks] }));
        void activityService.record({
          workspaceId: task.workspaceId,
          actorId,
          action: 'task_created',
          targetType: 'task',
          targetName: task.title,
        });
        if (task.assigneeId && task.assigneeId !== actorId) {
          void notificationService.push({
            userId: task.assigneeId,
            type: 'task_assigned',
            title: `You were assigned to ${task.title}`,
            href: '/app/tasks',
          });
        }
        return task;
      } catch {
        return null;
      }
    },

    update: (id, patch) => apply(id, patch),

    setStatus: async (id, status) => {
      const task = get().tasks.find((t) => t.id === id);
      const wasCompleted = task?.status === 'completed';
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      await apply(id, { status, completedAt });
      if (status === 'completed' && !wasCompleted && task) {
        void handleRecurrence(task);
      }
    },

    moveTask: async (id, newStatus, targetIndex) => {
      const before = get().tasks;
      const task = before.find((t) => t.id === id);
      if (!task) return;

      const completedAt = newStatus === 'completed' ? new Date().toISOString() : (task.status === 'completed' ? null : task.completedAt);
      const updatedTask: Task = { ...task, status: newStatus, completedAt, updatedAt: new Date().toISOString() };
      
      const filtered = before.filter((t) => t.id !== id);
      if (typeof targetIndex === 'number' && targetIndex >= 0) {
        filtered.splice(targetIndex, 0, updatedTask);
        set({ tasks: filtered });
      } else {
        set({ tasks: [updatedTask, ...filtered] });
      }

      try {
        await taskService.update(id, { status: newStatus, completedAt });
        if (newStatus === 'completed' && task.status !== 'completed') {
          void activityService.record({
            workspaceId: task.workspaceId,
            actorId: task.assigneeId ?? task.creatorId,
            action: 'task_completed',
            targetType: 'task',
            targetName: task.title,
          });
          void useNotificationStore.getState().refresh();
          void handleRecurrence(task);
        }
      } catch {
        set({ tasks: before });
      }
    },

    bulkUpdateStatus: async (ids, status) => {
      const before = get().tasks;
      const completedAt = status === 'completed' ? new Date().toISOString() : null;
      const idSet = new Set(ids);
      set({
        tasks: before.map((t) => (idSet.has(t.id) ? { ...t, status, completedAt, updatedAt: new Date().toISOString() } : t)),
      });
      try {
        await Promise.all(ids.map((id) => taskService.update(id, { status, completedAt })));
      } catch {
        set({ tasks: before });
      }
    },

    bulkDelete: async (ids) => {
      const before = get().tasks;
      const idSet = new Set(ids);
      set({ tasks: before.filter((t) => !idSet.has(t.id)) });
      try {
        await Promise.all(ids.map((id) => taskService.remove(id)));
      } catch {
        set({ tasks: before });
      }
    },

    addSubtask: async (taskId, title) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newSubtask = { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: title.trim(), done: false };
      const subtasks = [...task.subtasks, newSubtask];
      await apply(taskId, { subtasks });
    },

    toggleSubtask: async (taskId, subtaskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const subtasks = task.subtasks.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st));
      await apply(taskId, { subtasks });
    },

    removeSubtask: async (taskId, subtaskId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const subtasks = task.subtasks.filter((st) => st.id !== subtaskId);
      await apply(taskId, { subtasks });
    },

    addComment: async (taskId, authorId, content) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const newComment = {
        id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        authorId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      const comments = [...(task.comments ?? []), newComment];
      await apply(taskId, { comments });
      void activityService.record({
        workspaceId: task.workspaceId,
        actorId: authorId,
        action: 'task_updated',
        targetType: 'task',
        targetName: task.title,
      });
    },

    logTime: async (taskId, minutes) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const trackedMinutes = Math.max(0, (task.trackedMinutes ?? 0) + minutes);
      await apply(taskId, { trackedMinutes });
    },

    toggleComplete: async (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      const done = task.status === 'completed';
      await apply(id, { status: done ? 'todo' : 'completed', completedAt: done ? null : new Date().toISOString() });
      if (!done) {
        void activityService.record({
          workspaceId: task.workspaceId,
          actorId: task.assigneeId ?? task.creatorId,
          action: 'task_completed',
          targetType: 'task',
          targetName: task.title,
        });
        void useNotificationStore.getState().refresh();
        void handleRecurrence(task);
      }
    },

    remove: async (id) => {
      const task = get().tasks.find((t) => t.id === id) ?? null;
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      await taskService.remove(id).catch(() => undefined);
      return task;
    },

    /** Used by "Undo": puts a deleted task back through the service. */
    restore: (task) => {
      set((s) => ({ tasks: [task, ...s.tasks] }));
      void taskService.restore(task);
    },

    reset: () => set({ workspaceId: null, tasks: [], status: 'idle' }),
  };
});
