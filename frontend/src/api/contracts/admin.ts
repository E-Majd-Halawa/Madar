import type { User, Workspace, Task, Project, Role } from '@/types';

export interface AdminUser extends Omit<User, 'status'> {
  status: 'active' | 'suspended' | 'banned';
  lastActive: string;
  taskCount: number;
  workspaceCount: number;
}

export interface AdminWorkspace extends Workspace {
  status: 'active' | 'suspended' | 'archived';
  ownerName: string;
  memberCount: number;
  projectCount: number;
}

export interface AdminReport {
  id: string;
  type: 'message' | 'user' | 'project' | 'other';
  reason: 'spam' | 'harassment' | 'inappropriate' | 'other';
  status: 'New' | 'Reviewing' | 'Resolved' | 'Rejected';
  reporterName: string;
  targetDescription: string;
  targetId: string;
  createdAt: string;
  moderatorNotes?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'session' | 'suspicious' | 'password_change' | 'role_change';
  descriptionKey: string;
  descriptionParams?: Record<string, any>;
  description?: string;
  ipAddress: string;
  device: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  revoked?: boolean;
}

export interface SystemSettings {
  registrationOpen: boolean;
  defaultLanguage: 'en' | 'ar';
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actionKey?: string;
  actionParams?: Record<string, any>;
  targetKey?: string;
  targetParams?: Record<string, any>;
  ipAddress: string;
  device: string;
  status: 'success' | 'warning' | 'error';
  createdAt: string;
  action?: string;
  target?: string;
}
