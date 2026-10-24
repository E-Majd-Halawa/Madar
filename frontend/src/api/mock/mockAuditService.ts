import type { AuditEvent } from '@/api/contracts/admin';
import type { AuditService } from '@/api/contracts/audit';
import { delay } from './delay';

const BASE_TIME = Date.parse('2026-10-18T12:00:00Z');
const hoursAgo = (h: number) => new Date(BASE_TIME - h * 3600_000).toISOString();

let mockAuditEvents: AuditEvent[] = [
  { id: 'aud-1', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.userRoleUpdated', targetKey: 'admin.audit.targets.userRole', targetParams: { name: 'Charlie Brown', role: 'Moderator' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(1) },
  { id: 'aud-2', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.workspaceSuspended', targetKey: 'admin.audit.targets.workspaceName', targetParams: { name: 'Alpha Corp' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'warning', createdAt: hoursAgo(3) },
  { id: 'aud-3', actorId: 'u-001', actorName: 'Demo User', actionKey: 'admin.audit.actions.loginAttempt', targetKey: 'admin.audit.targets.authSso', ipAddress: '127.0.0.1', device: 'Safari / macOS', status: 'success', createdAt: hoursAgo(5) },
  { id: 'aud-4', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.reportResolved', targetKey: 'admin.audit.targets.reportId', targetParams: { id: 'rep-3' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(8) },
  { id: 'aud-5', actorId: 'u-003', actorName: 'Alex Turner', actionKey: 'admin.audit.actions.failedLogin', targetKey: 'admin.audit.targets.authPassword', ipAddress: '192.168.1.45', device: 'Chrome / Windows', status: 'error', createdAt: hoursAgo(10) },
  { id: 'aud-6', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.settingsUpdated', targetKey: 'admin.audit.targets.systemConfig', ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(14) },
  { id: 'aud-7', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.userSuspended', targetKey: 'admin.audit.targets.userEmail', targetParams: { email: 'spammer@test.com' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'warning', createdAt: hoursAgo(20) },
  { id: 'aud-8', actorId: 'u-001', actorName: 'Demo User', actionKey: 'admin.audit.actions.taskDeleted', targetKey: 'admin.audit.targets.taskId', targetParams: { id: 't-105' }, ipAddress: '127.0.0.1', device: 'Safari / macOS', status: 'success', createdAt: hoursAgo(24) },
  { id: 'aud-9', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.projectArchived', targetKey: 'admin.audit.targets.projectId', targetParams: { id: 'p-008' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(30) },
  { id: 'aud-10', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.sessionRevoked', targetKey: 'admin.audit.targets.sessionId', targetParams: { id: 'sec-2' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'warning', createdAt: hoursAgo(35) },
  { id: 'aud-11', actorId: 'u-005', actorName: 'Security Bot', actionKey: 'admin.audit.actions.suspiciousIpDetected', targetKey: 'admin.audit.targets.ip', targetParams: { ip: '203.0.113.4' }, ipAddress: '203.0.113.4', device: 'Automated Bot', status: 'error', createdAt: hoursAgo(40) },
  { id: 'aud-12', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.userCreated', targetKey: 'admin.audit.targets.userEmail', targetParams: { email: 'newuser@taskflow3d.com' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(45) },
  { id: 'aud-13', actorId: 'u-001', actorName: 'Demo User', actionKey: 'admin.audit.actions.workspaceCreated', targetKey: 'admin.audit.targets.workspaceName', targetParams: { name: 'Beta Launch' }, ipAddress: '127.0.0.1', device: 'Safari / macOS', status: 'success', createdAt: hoursAgo(50) },
  { id: 'aud-14', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.reportRejected', targetKey: 'admin.audit.targets.reportId', targetParams: { id: 'rep-5' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(55) },
  { id: 'aud-15', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.passwordChanged', targetKey: 'admin.audit.targets.adminAccount', ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(60) },
  { id: 'aud-16', actorId: 'u-001', actorName: 'Demo User', actionKey: 'admin.audit.actions.fileUploaded', targetKey: 'admin.audit.targets.fileName', targetParams: { name: 'Architecture.pdf' }, ipAddress: '127.0.0.1', device: 'Safari / macOS', status: 'success', createdAt: hoursAgo(65) },
  { id: 'aud-17', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.userDeleted', targetKey: 'admin.audit.targets.userEmail', targetParams: { email: 'old@test.com' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'warning', createdAt: hoursAgo(70) },
  { id: 'aud-18', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.systemBackup', targetKey: 'admin.audit.targets.dbSnapshot', ipAddress: '127.0.0.1', device: 'System Cron', status: 'success', createdAt: hoursAgo(75) },
  { id: 'aud-19', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.roleAssigned', targetKey: 'admin.audit.targets.userRole', targetParams: { name: 'Elena Rostova', role: 'Admin' }, ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'success', createdAt: hoursAgo(80) },
  { id: 'aud-20', actorId: 'u-002', actorName: 'Admin User', actionKey: 'admin.audit.actions.maintenanceToggled', targetKey: 'admin.audit.targets.systemState', ipAddress: '192.168.1.10', device: 'Chrome / Windows', status: 'warning', createdAt: hoursAgo(90) },
];

export const mockAuditService: AuditService = {
  async getEvents(): Promise<AuditEvent[]> {
    await delay(200);
    return [...mockAuditEvents];
  },
  async logEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
    const newEvent: AuditEvent = {
      ...event,
      id: `aud-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockAuditEvents = [newEvent, ...mockAuditEvents];
    return newEvent;
  },
};
