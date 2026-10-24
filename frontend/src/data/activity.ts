import type { ActivityEvent, FocusSession } from '@/types';
import { dayOffsetIso, hoursAgoIso } from '@/utils/dates';

type Row = [workspaceId: string, actorId: string, action: ActivityEvent['action'], targetType: ActivityEvent['targetType'], target: string, hours: number];

const ROWS: Row[] = [
  ['ws-demo', 'u-004', 'file_uploaded', 'file', 'Mobile_Design_System_v3.fig', 1],
  ['ws-demo', 'u-004', 'task_completed', 'task', 'Set up PostgreSQL schema and migrations', 2],
  ['ws-demo', 'u-001', 'task_updated', 'task', 'Build authentication endpoints', 3],
  ['ws-demo', 'u-005', 'comment_added', 'comment', 'Reviewed mobile checkout wireframe changes', 4],
  ['ws-demo', 'u-006', 'task_updated', 'task', 'Write integration tests for task routes', 5],
  ['ws-demo', 'u-001', 'file_uploaded', 'file', 'Mobile_App_Architecture_Spec.pdf', 6],
  ['ws-demo', 'u-002', 'project_created', 'project', 'Mobile App Redesign', 8],
  ['ws-demo', 'u-010', 'task_completed', 'task', 'Define color and spacing tokens', 11],
  ['ws-demo', 'u-005', 'message_sent', 'channel', '#backend', 14],
  ['ws-demo', 'u-003', 'file_uploaded', 'file', 'openapi-spec-v2.json', 17],
  ['ws-demo', 'u-002', 'member_invited', 'member', 'zaid.alkhatib@example.com', 20],
  ['ws-demo', 'u-001', 'task_created', 'task', 'Fix pagination bug on tasks endpoint', 26],
  ['ws-demo', 'u-008', 'task_completed', 'task', 'Configure CI pipeline for API', 30],
  ['ws-demo', 'u-002', 'file_uploaded', 'file', 'Brand_Assets_Icons_Master.zip', 35],
  ['ws-demo', 'u-002', 'role_changed', 'member', 'Sara Haddad → Moderator', 40],
  ['ws-demo', 'u-007', 'comment_added', 'comment', 'Updated latency benchmarking numbers', 44],
  ['ws-demo', 'u-007', 'task_updated', 'task', 'Add optimistic updates to task list', 52],
  ['ws-demo', 'u-002', 'project_created', 'project', 'Design System 2.0', 60],
  ['ws-demo', 'u-002', 'settings_changed', 'workspace', 'Default task view', 70],
  ['ws-demo', 'u-003', 'file_uploaded', 'file', 'Master_Services_Agreement_2026.pdf', 96],
  ['ws-demo', 'u-001', 'project_created', 'project', 'API Modernization', 120],
  ['ws-demo', 'u-002', 'member_invited', 'member', 'leila.nour@example.com', 140],
];

export const SEED_ACTIVITY: ActivityEvent[] = ROWS.map(([workspaceId, actorId, action, targetType, targetName, hours], i) => ({
  id: `act-${i + 1}`,
  workspaceId,
  actorId,
  action,
  targetType,
  targetName,
  createdAt: hoursAgoIso(hours),
}));

/** Focus sessions for the demo user over the last two weeks (drives dashboard + analytics). */
const MINUTES = [50, 25, 75, 100, 25, 50, 0, 0, 125, 75, 50, 100, 25, 150];
export const SEED_FOCUS_SESSIONS: FocusSession[] = MINUTES.flatMap((minutes, daysAgo) =>
  minutes === 0
    ? []
    : [{ id: `fs-${daysAgo}`, userId: 'u-001', workspaceId: 'ws-demo', taskId: null, startedAt: dayOffsetIso(-daysAgo, 10), minutes }],
);
