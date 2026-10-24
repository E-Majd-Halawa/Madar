import type { AdminUser, AdminWorkspace, AdminReport, SecurityEvent, SystemSettings } from '@/api/contracts/admin';
import type { Role, Task, Project } from '@/types';
import { getAllUsers } from '@/api/mock/userRegistry';
import { SEED_WORKSPACES } from '@/data/workspaces';
import { SEED_TASKS } from '@/data/tasks';
import { SEED_PROJECTS } from '@/data/projects';
import { delay } from './delay';

const users = getAllUsers();

let mockUsers: AdminUser[] = users.map((user, index) => ({
  ...user,
  status: index % 7 === 0 ? 'suspended' : 'active',
  lastActive: new Date(Date.now() - index * 3600000 * 4).toISOString(),
  taskCount: Math.floor(Math.random() * 12) + 1,
  workspaceCount: Math.floor(Math.random() * 3) + 1,
}));

let mockWorkspaces: AdminWorkspace[] = SEED_WORKSPACES.map((workspace, index) => ({
  ...workspace,
  status: index === 3 ? 'suspended' : index === 4 ? 'archived' : 'active',
  ownerName: users[index % users.length].fullName,
  memberCount: Math.floor(Math.random() * 10) + 2,
  projectCount: Math.floor(Math.random() * 5) + 1,
}));

let mockReports: AdminReport[] = [
  { id: 'rep-1', type: 'message', reason: 'spam', status: 'New', reporterName: 'Sarah Jenkins', targetDescription: 'Promoting external crypto links in chat #general', targetId: 'msg-101', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'rep-2', type: 'user', reason: 'harassment', status: 'Reviewing', reporterName: 'David Miller', targetDescription: 'Offensive language in direct messages', targetId: 'u-004', createdAt: new Date(Date.now() - 3600000 * 8).toISOString() },
  { id: 'rep-3', type: 'project', reason: 'inappropriate', status: 'Resolved', reporterName: 'Alice Wong', targetDescription: 'Inappropriate project title and assets', targetId: 'p-003', createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), moderatorNotes: 'Project deleted and owner warned.' },
  { id: 'rep-4', type: 'message', reason: 'harassment', status: 'New', reporterName: 'Bob Smith', targetDescription: 'Spamming notifications', targetId: 'msg-102', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: 'rep-5', type: 'user', reason: 'spam', status: 'Rejected', reporterName: 'Charlie Brown', targetDescription: 'False report on active task discussion', targetId: 'u-007', createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), moderatorNotes: 'No policy violation found.' },
  { id: 'rep-6', type: 'message', reason: 'inappropriate', status: 'Reviewing', reporterName: 'Diana Prince', targetDescription: 'Sharing copyrighted code snippets', targetId: 'msg-103', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: 'rep-7', type: 'other', reason: 'other', status: 'New', reporterName: 'Bruce Wayne', targetDescription: 'System integration glitch feedback', targetId: 'sys-1', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
  { id: 'rep-8', type: 'user', reason: 'spam', status: 'Resolved', reporterName: 'Clark Kent', targetDescription: 'Duplicate bot accounts', targetId: 'u-012', createdAt: new Date(Date.now() - 3600000 * 36).toISOString() },
  { id: 'rep-9', type: 'message', reason: 'harassment', status: 'Reviewing', reporterName: 'Barry Allen', targetDescription: 'Aggressive debate in channel', targetId: 'msg-109', createdAt: new Date(Date.now() - 3600000 * 15).toISOString() },
  { id: 'rep-10', type: 'project', reason: 'spam', status: 'New', reporterName: 'Hal Jordan', targetDescription: 'Empty test projects spam', targetId: 'p-011', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'rep-11', type: 'user', reason: 'inappropriate', status: 'Resolved', reporterName: 'Arthur Curry', targetDescription: 'Impersonation profile picture', targetId: 'u-015', createdAt: new Date(Date.now() - 3600000 * 60).toISOString() },
  { id: 'rep-12', type: 'message', reason: 'spam', status: 'New', reporterName: 'Victor Stone', targetDescription: 'Phishing link in comments', targetId: 'msg-115', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
];

let mockSecurityEvents: SecurityEvent[] = [
  { id: 'sec-1', type: 'failed_login', descriptionKey: 'admin.security.descriptions.multipleFailedAttempts', ipAddress: '192.168.1.45', device: 'Chrome / Windows', userId: 'u-003', userName: 'Alex Turner', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'sec-2', type: 'session', descriptionKey: 'admin.security.descriptions.activeWebSession', ipAddress: '10.0.0.15', device: 'Safari / macOS', userId: 'u-001', userName: 'Demo User', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), revoked: false },
  { id: 'sec-3', type: 'suspicious', descriptionKey: 'admin.security.descriptions.unusualGeoLogin', ipAddress: '203.0.113.4', device: 'Firefox / Linux', userId: 'u-008', userName: 'Elena Rostova', createdAt: new Date(Date.now() - 3600000 * 18).toISOString() },
  { id: 'sec-4', type: 'password_change', descriptionKey: 'admin.security.descriptions.passwordUpdated', ipAddress: '192.168.1.10', device: 'Chrome / Windows', userId: 'u-002', userName: 'Admin User', createdAt: new Date(Date.now() - 3600000 * 25).toISOString() },
  { id: 'sec-5', type: 'role_change', descriptionKey: 'admin.security.descriptions.roleUpgraded', ipAddress: '127.0.0.1', device: 'Edge / Windows', userId: 'u-002', userName: 'Admin User', createdAt: new Date(Date.now() - 3600000 * 50).toISOString() },
];

let mockSettings: SystemSettings = {
  registrationOpen: true,
  defaultLanguage: 'en',
  maintenanceMode: false,
  sessionTimeoutMinutes: 60,
};

export const mockAdminService = {
  async getUsers(): Promise<AdminUser[]> {
    await delay(200);
    return [...mockUsers];
  },
  async updateUserRole(userId: string, role: Role): Promise<AdminUser> {
    await delay(200);
    mockUsers = mockUsers.map(u => u.id === userId ? { ...u, role } : u);
    return mockUsers.find(u => u.id === userId)!;
  },
  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<AdminUser> {
    await delay(200);
    mockUsers = mockUsers.map(u => u.id === userId ? { ...u, status } : u);
    return mockUsers.find(u => u.id === userId)!;
  },
  async deleteUser(userId: string): Promise<void> {
    await delay(200);
    mockUsers = mockUsers.filter(u => u.id !== userId);
  },

  async getWorkspaces(): Promise<AdminWorkspace[]> {
    await delay(200);
    return [...mockWorkspaces];
  },
  async updateWorkspaceStatus(workspaceId: string, status: 'active' | 'suspended' | 'archived'): Promise<AdminWorkspace> {
    await delay(200);
    mockWorkspaces = mockWorkspaces.map(w => w.id === workspaceId ? { ...w, status } : w);
    return mockWorkspaces.find(w => w.id === workspaceId)!;
  },

  async getTasks(): Promise<Task[]> {
    await delay(200);
    return [...SEED_TASKS];
  },
  async deleteTask(taskId: string): Promise<void> {
    await delay(200);
  },

  async getProjects(): Promise<Project[]> {
    await delay(200);
    return [...SEED_PROJECTS];
  },
  async deleteProject(projectId: string): Promise<void> {
    await delay(200);
  },

  async getReports(): Promise<AdminReport[]> {
    await delay(200);
    return [...mockReports];
  },
  async updateReport(reportId: string, status: AdminReport['status'], moderatorNotes?: string): Promise<AdminReport> {
    await delay(200);
    mockReports = mockReports.map(r => r.id === reportId ? { ...r, status, moderatorNotes: moderatorNotes ?? r.moderatorNotes } : r);
    return mockReports.find(r => r.id === reportId)!;
  },

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    await delay(200);
    return [...mockSecurityEvents];
  },
  async revokeSession(sessionId: string): Promise<void> {
    await delay(200);
    mockSecurityEvents = mockSecurityEvents.map(s => s.id === sessionId ? { ...s, revoked: true } : s);
  },

  async getSettings(): Promise<SystemSettings> {
    await delay(100);
    return { ...mockSettings };
  },
  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    await delay(200);
    mockSettings = { ...mockSettings, ...settings };
    return { ...mockSettings };
  },
};
