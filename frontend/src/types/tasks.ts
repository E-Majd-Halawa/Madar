export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

/** Phase 4 task model with checklist, comments, estimates and tracking. */
export interface Task {
  id: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  startDate: string | null;
  dueDate: string | null;
  assigneeId: string | null;
  creatorId: string;
  tags: string[];
  subtasks: Subtask[];
  comments?: TaskComment[];
  estimateMinutes: number | null;
  trackedMinutes: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskPatch = Partial<Omit<Task, 'id' | 'workspaceId' | 'createdAt'>>;

export type TaskViewMode = 'all' | 'today' | 'upcoming' | 'completed';
export type TaskSortField = 'dueDate' | 'priority' | 'title' | 'createdAt';
export type TaskGroupField = 'none' | 'status' | 'project' | 'priority';

export interface FilterState {
  search: string;
  status: string;
  priority: string;
  project: string;
  assignee: string;
  sortField: TaskSortField;
  sortDirection: 'asc' | 'desc';
}

