import type { Project } from '@/types';
import { http } from './httpClient';
import type { ProjectService } from '@/api/contracts';

export const httpProjectService: ProjectService = {
  listByWorkspace(workspaceId) {
    return http<Project[]>(`/workspaces/${workspaceId}/projects`);
  },
  getById(id) {
    return http<Project>(`/projects/${id}`).catch((e) => {
      if ((e as any)?.status === 404) return null as any;
      throw e;
    });
  },
  create(input) {
    return http<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  update(id, patch) {
    return http<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },
  remove(id) {
    return http<void>(`/projects/${id}`, { method: 'DELETE' });
  },
};
