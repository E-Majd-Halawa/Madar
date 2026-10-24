import type { Project } from '@/types';

/** GET /workspaces/:id/projects  ·  POST /projects  ·  PATCH /projects/:id */
export interface ProjectService {
  listByWorkspace(workspaceId: string): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  create(input: Omit<Project, 'id' | 'createdAt'>): Promise<Project>;
  update(id: string, patch: Partial<Project>): Promise<Project>;
  remove(id: string): Promise<void>;
}
