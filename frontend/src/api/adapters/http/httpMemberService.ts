import type { PendingInvite, Workspace, WorkspaceMemberItem, WorkspaceRole } from '@/types';
import { HttpError, http } from './httpClient';

/**
 * Workspace-scoped member/invitation adapter.
 *
 * The public `MembersService` contract is store-shaped and does not carry a
 * workspace id, so the store keeps the active workspace id and passes it here.
 */
export interface HttpMemberService {
  load(workspaceId: string): Promise<{
    members: WorkspaceMemberItem[];
    pendingInvites: PendingInvite[];
  }>;
  acceptInvitation(token: string): Promise<Workspace>;
  inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    department: string,
  ): Promise<PendingInvite>;
  updateRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMemberItem>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
  cancelInvite(workspaceId: string, inviteId: string): Promise<void>;
  resendInvite(workspaceId: string, inviteId: string): Promise<void>;
}

const workspacePath = (workspaceId: string): string =>
  `/workspaces/${workspaceId}`;

export const httpMemberService: HttpMemberService = {
  async acceptInvitation(token) {
    return http<Workspace>('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async load(workspaceId) {
    const members = await http<WorkspaceMemberItem[]>(
      `${workspacePath(workspaceId)}/members`,
    );

    let pendingInvites: PendingInvite[] = [];
    try {
      pendingInvites = await http<PendingInvite[]>(
        `${workspacePath(workspaceId)}/invitations`,
      );
    } catch (error) {
      // Regular members can read the directory but not invitations.
      if (!(error instanceof HttpError) || error.status !== 403) throw error;
    }

    return { members, pendingInvites };
  },

  inviteMember(workspaceId, email, role, department) {
    return http<PendingInvite>(`${workspacePath(workspaceId)}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role, department }),
    });
  },

  updateRole(workspaceId, userId, role) {
    return http<WorkspaceMemberItem>(
      `${workspacePath(workspaceId)}/members/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
    );
  },

  removeMember(workspaceId, userId) {
    return http<void>(`${workspacePath(workspaceId)}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  cancelInvite(workspaceId, inviteId) {
    return http<void>(`${workspacePath(workspaceId)}/invitations/${inviteId}`, {
      method: 'DELETE',
    });
  },

  resendInvite(workspaceId, inviteId) {
    return http<void>(
      `${workspacePath(workspaceId)}/invitations/${inviteId}/resend`,
      { method: 'POST' },
    );
  },
};
