import type { ProjectDto } from '../../common/contracts/api.contracts.js';

export interface PlainProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: string;
  color: string;
  ownerId: string;
  startDate: Date;
  dueDate: Date | null;
  createdAt: Date;
  members?: { userId: string }[];
}

export function toProjectDto(project: PlainProject): ProjectDto {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
    description: project.description,
    status: project.status as ProjectDto['status'],
    color: project.color,
    ownerId: project.ownerId,
    memberIds: (project.members ?? []).map((m) => m.userId),
    startDate: project.startDate.toISOString(),
    dueDate: project.dueDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
  };
}
