import type { TaskDto } from '../../common/contracts/api.contracts.js';

function asIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const asString = String(value);
  if (Number.isNaN(Date.parse(asString))) return asString;
  return new Date(asString).toISOString();
}

export function toTaskDto(task: any, spawned: any | null = null): TaskDto {
  return {
    id: task.id,
    workspaceId: task.workspaceId,
    projectId: task.projectId ?? null,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    category: task.category,
    startDate: asIso(task.startDate),
    dueDate: asIso(task.dueDate),
    assigneeId: task.assigneeId ?? null,
    creatorId: task.creatorId,
    tags: Array.isArray(task.tags) ? task.tags : [],
    subtasks: (task.subtasks ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      done: s.done,
    })),
    comments: (task.comments ?? []).map((c: any) => ({
      id: c.id,
      authorId: c.authorId,
      content: c.content,
      createdAt: asIso(c.createdAt)!,
    })),
    estimateMinutes: task.estimateMinutes ?? null,
    trackedMinutes: task.trackedMinutes ?? 0,
    recurrence: (task.recurrence ?? 'none').toLowerCase?.() ?? 'none',
    completedAt: asIso(task.completedAt),
    createdAt: asIso(task.createdAt)!,
    updatedAt: asIso(task.updatedAt)!,
    spawned: spawned ? toTaskDto(spawned) : undefined,
  };
}
