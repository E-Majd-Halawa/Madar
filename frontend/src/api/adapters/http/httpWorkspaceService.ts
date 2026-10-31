import type { WorkspaceService } from '@/api/contracts';
import type { Workspace } from '@/types';
import { http } from './httpClient';

/**
 * REST adapter for the Phase 3 /workspaces endpoints.
 * The backend derives the user from the access token; `userId` is kept in the
 * contract for mock parity but is intentionally not sent.
 */
export const httpWorkspaceService: WorkspaceService = {
  async listForUser(): Promise<Workspace[]> {
    return http<Workspace[]>('/workspaces');
  },

  async getById(id: string): Promise<Workspace | null> {
    try {
      return await http<Workspace>(`/workspaces/${id}`);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 403 || status === 404) return null;
      throw error;
    }
  },
};
