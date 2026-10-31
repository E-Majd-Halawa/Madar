import type { Task, TaskPatch } from '@/types';
import { HttpError, http } from './httpClient';
import type { TaskService, NewTaskInput } from '@/api/contracts';

// The task service contract returns Task (optionally with `spawned` when
// a recurrence child is created by the server).
export interface HttpTaskAdapter extends TaskService {
  listByWorkspace(workspaceId: string): Promise<Task[]>;
}

function toHttpError(error: unknown): never {
  throw error;
}

export const httpTaskService: TaskService = {
  listByWorkspace(workspaceId) {
    const q = new URLSearchParams();
    return http<Task[]>(`/workspaces/${workspaceId}/tasks?${q.toString()}`).catch(toHttpError);
  },
  create(input: NewTaskInput) {
    const { creatorId, ...body } = input as any;
    return http<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...body, workspaceId: input.workspaceId, title: input.title }),
    }).catch(toHttpError);
  },
  update(id, patch: TaskPatch) {
    return http<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).catch(toHttpError);
  },
  remove(id) {
    return http<void>(`/tasks/${id}`, { method: 'DELETE' }).catch(toHttpError);
  },
  restore(task) {
    return http<void>(`/tasks/${task.id}/restore`, { method: 'POST' }).catch(toHttpError);
  },
};
