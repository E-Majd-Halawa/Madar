/**
 * Backend copies of the frontend API contracts.
 *
 * Source of truth:
 *  - frontend/src/api/contracts/auth.ts
 *  - frontend/src/api/contracts/users.ts
 *  - frontend/src/types/index.ts
 *
 * The backend must not import frontend source files: they are not part of the
 * backend TS project and use browser-oriented module resolution.
 */
import type { Role } from '../permissions/permissions.js';

export type UserStatus = 'active' | 'suspended' | 'invited';

/** frontend/src/types/index.ts:4-14 */
export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastActiveAt: string;
}

/** frontend/src/types/index.ts:16-21 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** epoch milliseconds */
  expiresAt: number;
}

/** frontend/src/types/index.ts:23-28 */
export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  isDemo: boolean;
}

/** frontend/src/types/index.ts:43-48 */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** frontend/src/types/members.ts:1 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

/** frontend/src/types/index.ts:30-41 */
export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'team';
  ownerId: string;
  /** Derived from active workspace_members rows. */
  memberIds: string[];
  color: string;
  createdAt: string;
}

/** frontend/src/types/members.ts:3-14 */
export interface WorkspaceMemberItem {
  /** The frontend uses the user id here (memberStore.ts:65-81). */
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: WorkspaceRole;
  department: string;
  avatarUrl?: string;
  joinedAt: string;
  lastActiveAt: string;
  status: UserStatus;
}

/** frontend/src/types/members.ts:16-22 */
export interface PendingInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  department: string;
  invitedBy: string;
  invitedAt: string;
}

/**
 * Stable machine codes for workspace/member/invitation errors.
 * Auth codes stay in AuthErrorCode; this list is the Phase 3 addition.
 */
export const WORKSPACE_ERROR_CODES = [
  'not_a_member',
  'insufficient_workspace_role',
  'workspace_not_found',
  'member_not_found',
  'invitation_not_found',
  'invitation_expired',
  'invitation_email_mismatch',
  'already_member',
  'already_invited',
  'cannot_remove_last_owner',
  'personal_workspace_restricted',
  'invalid_role',
] as const;

export type WorkspaceErrorCode = (typeof WORKSPACE_ERROR_CODES)[number];

/** frontend/src/api/contracts/auth.ts:3-9 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_suspended'
  | 'email_taken'
  | 'username_taken'
  | 'session_expired'
  | 'unknown';

/** frontend/src/api/contracts/auth.ts:21-31 */
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

/** frontend/src/types/tasks.ts:1 */
export type TaskStatus =
  'backlog' | 'todo' | 'in_progress' | 'review' | 'completed' | 'archived';

/** frontend/src/types/tasks.ts:2 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/** frontend/src/types/index.ts? recurrence */
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

/** frontend/src/types/tasks.ts:4-8 */
export interface SubtaskDto {
  id: string;
  title: string;
  done: boolean;
}

/** frontend/src/types/tasks.ts:10-15 */
export interface TaskCommentDto {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

/** frontend/src/types/tasks.ts:18-40 */
export interface TaskDto {
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
  subtasks: SubtaskDto[];
  comments?: TaskCommentDto[];
  estimateMinutes: number | null;
  trackedMinutes: number;
  recurrence?: TaskRecurrence;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  spawned?: TaskDto | null;
}

/** frontend/src/types/projects.ts:1 */
export type ProjectStatus =
  'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

/** frontend/src/types/projects.ts:15-27 */
export interface ProjectDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  dueDate: string | null;
  createdAt: string;
}

/** Stable Phase 4 error codes for docs/spec. */
export const TASK_PROJECT_ERROR_CODES = [
  'task_not_found',
  'project_not_found',
  'subtask_not_found',
  'comment_not_found',
  'invalid_assignee',
  'invalid_project',
  'invalid_status',
] as const;
