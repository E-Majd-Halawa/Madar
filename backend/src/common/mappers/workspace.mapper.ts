import type { Workspace } from '../contracts/api.contracts.js';

export interface WorkspaceRecord {
  id: string;
  name: string;
  description: string;
  type: string;
  ownerId: string;
  color: string;
  createdAt: Date;
  members: Array<{ userId: string }>;
}

/** Explicit mapper to frontend/src/types/index.ts:32-41. */
export function toWorkspaceDto(workspace: WorkspaceRecord): Workspace {
  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    type: workspace.type as Workspace['type'],
    ownerId: workspace.ownerId,
    memberIds: workspace.members.map((member) => member.userId),
    color: workspace.color,
    createdAt: workspace.createdAt.toISOString(),
  };
}
