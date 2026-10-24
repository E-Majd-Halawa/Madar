import type { Project, ProjectStatus } from '@/types';
import { dayOffsetIso } from '@/utils/dates';

type Row = [
  id: string,
  workspaceId: string,
  name: string,
  description: string,
  status: ProjectStatus,
  color: string,
  ownerId: string,
  memberIds: string[],
  startOffset: number,
  dueOffset: number | null,
];

const ROWS: Row[] = [
  ['p-101', 'ws-demo', 'Node.js API Platform', 'REST API, authentication and database layer for the TaskFlow backend.', 'active', '#10b981', 'u-002', ['u-001', 'u-002', 'u-004', 'u-005', 'u-006', 'u-008'], -60, 21],
  ['p-102', 'ws-demo', 'React Web Client', 'The customer-facing web application built with React and TypeScript.', 'active', '#22d3ee', 'u-002', ['u-001', 'u-002', 'u-007', 'u-009', 'u-010', 'u-011'], -50, 28],
  ['p-103', 'ws-demo', 'Design System 2.0', 'Shared tokens, components and documentation for every product surface.', 'active', '#a78bfa', 'u-010', ['u-001', 'u-010', 'u-012', 'u-013'], -45, 14],
  ['p-104', 'ws-demo', 'Authentication & Security', 'Session handling, two-factor authentication and security review.', 'planning', '#f43f5e', 'u-002', ['u-001', 'u-002', 'u-005', 'u-003'], -5, 40],
  ['p-105', 'ws-demo', 'Mobile App Beta', 'Companion mobile experience with offline support.', 'on_hold', '#f59e0b', 'u-014', ['u-001', 'u-014', 'u-009'], -70, 90],
  ['p-106', 'ws-demo', 'Documentation Portal', 'Public documentation, guides and API reference.', 'completed', '#3b82f6', 'u-004', ['u-001', 'u-004', 'u-008'], -80, -1],
  ['p-201', 'ws-nova', 'Nova Core Services', 'Core microservices, routing and service-to-service communication.', 'active', '#a78bfa', 'u-002', ['u-001', 'u-002', 'u-009', 'u-019'], -55, 30],
  ['p-202', 'ws-nova', 'Billing Integration', 'Subscription billing, invoicing and payment provider integration.', 'planning', '#f59e0b', 'u-012', ['u-002', 'u-012', 'u-013'], -3, 60],
  ['p-203', 'ws-nova', 'Observability Stack', 'Tracing, metrics and alerting for production services.', 'active', '#22d3ee', 'u-015', ['u-003', 'u-015', 'u-016'], -30, 18],
  ['p-204', 'ws-nova', 'Nova Web Console', 'Internal admin console for operations and support teams.', 'active', '#10b981', 'u-001', ['u-001', 'u-018', 'u-020'], -20, 35],
  ['p-301', 'ws-design', 'Brand Refresh', 'New logo system, color palette and brand guidelines.', 'active', '#f59e0b', 'u-009', ['u-010', 'u-011', 'u-012'], -40, 12],
  ['p-302', 'ws-design', 'Research Repository', 'A searchable library of user research and insights.', 'active', '#3b82f6', 'u-014', ['u-014', 'u-015', 'u-016'], -25, 25],
  ['p-401', 'ws-oss', 'CLI Toolkit', 'Command-line tools for scaffolding and deployment.', 'active', '#10b981', 'u-003', ['u-003', 'u-016', 'u-018'], -35, 20],
  ['p-402', 'ws-oss', 'Plugin Registry', 'Package registry and manifest format for community plugins.', 'planning', '#a78bfa', 'u-003', ['u-003', 'u-017', 'u-019'], -4, 75],
  ['p-501', 'ws-personal-u-001', 'Learning Path: NestJS', 'A structured self-study plan for building production NestJS services.', 'active', '#22d3ee', 'u-001', ['u-001'], -14, 45],
];

export const SEED_PROJECTS: Project[] = ROWS.map(
  ([id, workspaceId, name, description, status, color, ownerId, memberIds, startOffset, dueOffset]) => ({
    id,
    workspaceId,
    name,
    description,
    status,
    color,
    ownerId,
    memberIds,
    startDate: dayOffsetIso(startOffset, 9),
    dueDate: dueOffset === null ? null : dayOffsetIso(dueOffset, 17),
    createdAt: dayOffsetIso(startOffset - 2, 9),
  }),
);
