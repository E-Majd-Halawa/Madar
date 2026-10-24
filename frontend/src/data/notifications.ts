import type { AppNotification, NotificationType } from '@/types';
import { hoursAgoIso } from '@/utils/dates';

type Row = [type: NotificationType, title: string, body: string, hours: number, read: boolean, href?: string];

const ROWS: Row[] = [
  ['task_assigned', 'You were assigned to Build authentication endpoints', 'Assigned by Admin User', 1, false, '/app/tasks'],
  ['mention', 'Ahmed mentioned you in #general', '“@demo can you review the API contract today?”', 3, false, '/app/chat'],
  ['deadline', 'Build authentication endpoints is due tomorrow', 'Estimated 4h · 2h 10m tracked', 5, false, '/app/tasks'],
  ['message', 'New message from Sara Haddad', 'The sprint demo moved to 3 PM.', 7, false, '/app/messages'],
  ['project_update', 'Node.js API Platform moved to 72% complete', 'Three tasks were completed this week.', 12, true, '/app/projects'],
  ['task_completed', 'Set up PostgreSQL schema and migrations was completed', 'Completed by Yousef Mansour', 26, true, '/app/tasks'],
  ['invitation', 'You were invited to Design Guild', 'Invited by Hana Suleiman', 30, true, '/app/members'],
  ['role_change', 'Your role in Demo Workspace was updated', 'You are now a member with extended access.', 48, true],
  ['security', 'New sign-in from Chrome on Windows', 'If this was not you, review your sessions.', 60, true, '/app/settings'],
  ['system', 'Welcome to TaskFlow 3D', 'Take a quick tour of tasks, focus mode and projects.', 72, true],

  // Additional 45+ notifications spanning 30 days
  ['task_assigned', 'You were assigned to Implement JWT refresh token rotation', 'Assigned by Tariq Aziz', 80, true, '/app/tasks'],
  ['deadline', 'Implement JWT refresh token rotation is due in 2 days', 'Priority: High', 90, true, '/app/tasks'],
  ['mention', 'Sara mentioned you in #frontend', '“Can we sync on the Tailwind v4 upgrade?”', 100, true, '/app/chat'],
  ['message', 'New message from Omar Khalil', 'Pull request #142 is ready for review.', 115, true, '/app/messages'],
  ['project_update', 'Design System 2.0 component library updated', 'Figma tokens synchronized with Tailwind config.', 130, true, '/app/projects'],
  ['task_completed', 'Design REST API contracts was completed', 'Completed by Demo User', 150, true, '/app/tasks'],
  ['invitation', 'New member joined Demo Workspace', 'Zaid Alkhatib accepted your invite.', 170, true, '/app/members'],
  ['system', 'Weekly productivity report is ready', 'You completed 14 tasks with 85% focus score.', 200, true, '/app/dashboard'],
  ['task_assigned', 'You were assigned to Add rate limiting middleware', 'Assigned by Maya Rahman', 220, true, '/app/tasks'],
  ['deadline', 'Add rate limiting middleware is due this week', 'Estimated 2h', 240, true, '/app/tasks'],
  ['mention', 'Noor mentioned you in #backend', '“The Redis cache TTL looks solid.”', 260, true, '/app/chat'],
  ['message', 'New message from Maya Rahman', 'Budget sign-off for Q3 is complete.', 280, true, '/app/messages'],
  ['project_update', 'Authentication & Security milestone reached', 'All security headers and 2FA policies enforced.', 300, true, '/app/projects'],
  ['task_completed', 'Write integration tests for task routes was completed', 'Completed by Karim Saleh', 330, true, '/app/tasks'],
  ['security', 'Password successfully updated', 'Your account security credentials were modified.', 360, true, '/app/settings'],
  ['role_change', 'You were promoted to Project Lead', 'Assigned by Admin User', 400, true],
  ['system', 'TaskFlow 3D v2.1 update available', 'Performance enhancements and bug fixes.', 450, true],
  ['task_assigned', 'You were assigned to Configure CI pipeline for API', 'Assigned by Tariq Aziz', 480, true, '/app/tasks'],
  ['deadline', 'Configure CI pipeline for API is due soon', 'CI runner configuration required', 500, true, '/app/tasks'],
  ['mention', 'Hana mentioned you in #design', '“Let us review the accessibility audit findings.”', 530, true, '/app/chat'],
  ['message', 'New message from Elena Petrova', 'Translation keys for Arabic RTL verified.', 560, true, '/app/messages'],
  ['project_update', 'Mobile App Beta milestone on track', 'Q3 release candidate scheduled.', 600, true, '/app/projects'],
  ['task_completed', 'Configure CI pipeline for API was completed', 'Completed by Demo User', 650, true, '/app/tasks'],
  ['invitation', 'Workspace invitation sent', 'Invite sent to partner@example.com', 700, true, '/app/members'],
  ['system', 'Data backup completed successfully', 'Automated cloud snapshot verified.', 720, true],
];

export const SEED_NOTIFICATIONS: AppNotification[] = ROWS.map(([type, title, body, hours, read, href], i) => ({
  id: `ntf-${i + 1}`,
  userId: 'u-001',
  type,
  title,
  body,
  read,
  href,
  createdAt: hoursAgoIso(hours),
}));
