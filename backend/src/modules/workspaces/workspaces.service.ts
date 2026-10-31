import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Workspace } from '../../common/contracts/api.contracts.js';
import { toWorkspaceDto } from '../../common/mappers/workspace.mapper.js';
import { WorkspacesRepository } from './workspaces.repository.js';

@Injectable()
export class WorkspacesService {
  constructor(private readonly workspaces: WorkspacesRepository) {}

  /**
   * Ensures the caller has a personal workspace, then returns every workspace
   * they are an active member of. Personal workspaces sort first.
   */
  async list(userId: string): Promise<Workspace[]> {
    await this.workspaces.transaction(async (tx) => {
      const personal = await this.workspaces.findPersonalByOwner(userId, tx);
      if (!personal) {
        await this.workspaces.createPersonalWorkspace(userId, tx);
      }
    });

    const rows = await this.workspaces.findForUser(userId);

    return rows
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'personal' ? -1 : 1;
        const byName = a.name.localeCompare(b.name);
        return byName !== 0 ? byName : a.id.localeCompare(b.id);
      })
      .map(toWorkspaceDto);
  }

  /** Defense in depth: the guard already checked membership. */
  async getById(userId: string, workspaceId: string): Promise<Workspace> {
    const workspace = await this.workspaces.findForMember(workspaceId, userId);

    if (!workspace) {
      throw new ForbiddenException({
        code: 'not_a_member',
        message: 'You are not a member of this workspace.',
      });
    }

    return toWorkspaceDto(workspace);
  }
}
