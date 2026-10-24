import type { Workspace } from '@/types';

/** GET /workspaces (current user)  ·  GET /workspaces/:id */
export interface WorkspaceService {
  listForUser(userId: string): Promise<Workspace[]>;
  getById(id: string): Promise<Workspace | null>;
}
