import type { Task, TaskPatch } from '@/types';

export type NewTaskInput = Pick<Task, 'workspaceId' | 'title' | 'creatorId'> & TaskPatch;

/** GET /workspaces/:id/tasks  ·  POST /tasks  ·  PATCH /tasks/:id  ·  DELETE /tasks/:id */
export interface TaskService {
  listByWorkspace(workspaceId: string): Promise<Task[]>;
  create(input: NewTaskInput): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
  /** Re-inserts a previously deleted task unchanged (powers "Undo"). POST /tasks/:id/restore */
  restore(task: Task): Promise<void>;
}
