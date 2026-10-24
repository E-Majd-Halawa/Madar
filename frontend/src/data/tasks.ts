import type { Subtask, Task, TaskPriority, TaskStatus } from '@/types';
import { dayOffsetIso } from '@/utils/dates';

type Row = [
  n: number,
  workspaceId: string,
  projectId: string | null,
  title: string,
  status: TaskStatus,
  priority: TaskPriority,
  dueOffset: number | null,
  assigneeId: string,
  tags: string[],
  estimateMinutes: number,
  trackedMinutes: number,
  doneDaysAgo: number | null,
  description: string,
];

const D = 'ws-demo';
const N = 'ws-nova';
const G = 'ws-design';
const O = 'ws-oss';
const P = 'ws-personal-u-001';

const ROWS: Row[] = [
  // Node.js API Platform
  [1, D, 'p-101', 'Design REST API contracts', 'completed', 'high', -12, 'u-001', ['api', 'backend'], 180, 195, 12, 'Define request and response shapes for tasks, projects and users.'],
  [2, D, 'p-101', 'Build authentication endpoints', 'in_progress', 'urgent', 1, 'u-001', ['nodejs', 'auth'], 240, 130, null, 'Register, login, logout and refresh endpoints with validation.'],
  [3, D, 'p-101', 'Implement JWT refresh token rotation', 'todo', 'high', 3, 'u-001', ['auth', 'security'], 150, 0, null, 'Rotate refresh tokens on every use and revoke reused ones.'],
  [4, D, 'p-101', 'Set up PostgreSQL schema and migrations', 'completed', 'high', -9, 'u-004', ['database'], 200, 215, 9, 'Initial tables, indexes and a repeatable migration workflow.'],
  [5, D, 'p-101', 'Write integration tests for task routes', 'review', 'medium', 2, 'u-006', ['testing', 'api'], 120, 105, null, 'Cover create, update, filter and permission checks.'],
  [6, D, 'p-101', 'Add rate limiting middleware', 'backlog', 'medium', null, 'u-005', ['nodejs', 'security'], 90, 0, null, 'Protect login and public endpoints from brute-force traffic.'],
  [7, D, 'p-101', 'Document API with OpenAPI spec', 'todo', 'medium', 6, 'u-001', ['documentation', 'api'], 120, 0, null, 'Generate a spec and publish an interactive reference.'],
  [8, D, 'p-101', 'Configure CI pipeline for API', 'completed', 'medium', -5, 'u-008', ['deployment'], 100, 90, 5, 'Lint, test and build on every pull request.'],
  [9, D, 'p-101', 'Fix pagination bug on tasks endpoint', 'in_progress', 'high', -1, 'u-001', ['bug', 'backend'], 60, 25, null, 'Last page returns duplicate items when sorting by due date.'],
  // React Web Client
  [10, D, 'p-102', 'Build login and register screens', 'completed', 'high', -6, 'u-001', ['react', 'auth'], 240, 260, 6, 'Forms with validation, password strength and loading states.'],
  [11, D, 'p-102', 'Create dashboard layout', 'in_progress', 'high', 0, 'u-001', ['react', 'ui'], 300, 170, null, 'Sidebar, top bar, stat cards and chart widgets.'],
  [12, D, 'p-102', 'Implement Kanban drag and drop', 'todo', 'urgent', 2, 'u-001', ['react', 'ui'], 240, 0, null, 'Smooth column moves with keyboard support and persistence.'],
  [13, D, 'p-102', 'Add optimistic updates to task list', 'review', 'medium', 0, 'u-007', ['react', 'performance'], 90, 80, null, 'Update the UI instantly and roll back on failure.'],
  [14, D, 'p-102', 'Set up client-side data caching', 'backlog', 'low', null, 'u-009', ['react', 'performance'], 120, 0, null, 'Cache list queries and invalidate on mutations.'],
  [15, D, 'p-102', 'Accessibility audit of forms', 'todo', 'medium', 5, 'u-010', ['accessibility', 'testing'], 120, 0, null, 'Check labels, focus order and error announcements.'],
  [16, D, 'p-102', 'Fix layout overflow on mobile', 'in_progress', 'medium', -2, 'u-011', ['bug', 'ui'], 75, 40, null, 'Tables and chips overflow the viewport below 400px.'],
  // Design System 2.0
  [17, D, 'p-103', 'Define color and spacing tokens', 'completed', 'high', -14, 'u-010', ['design', 'tokens'], 160, 150, 14, 'Semantic tokens for every theme and density.'],
  [18, D, 'p-103', 'Design task card component', 'completed', 'medium', -3, 'u-001', ['design', 'ui'], 90, 100, 3, 'Compact and expanded variants with priority and assignee.'],
  [19, D, 'p-103', 'Create empty state illustrations', 'in_progress', 'medium', 4, 'u-012', ['design'], 180, 60, null, 'Friendly illustrations for tasks, files and messages.'],
  [20, D, 'p-103', 'Document button and input variants', 'todo', 'low', 8, 'u-001', ['documentation', 'design'], 60, 0, null, 'Usage guidance and do/don’t examples.'],
  [21, D, 'p-103', 'Review dark theme contrast ratios', 'review', 'high', 1, 'u-013', ['accessibility', 'design'], 90, 70, null, 'Verify text and controls meet WCAG AA in every theme.'],
  // Authentication & Security
  [22, D, 'p-104', 'Threat model for session handling', 'todo', 'high', 7, 'u-002', ['security'], 150, 0, null, 'Identify token theft and fixation risks with mitigations.'],
  [23, D, 'p-104', 'Add two-factor authentication flow', 'backlog', 'high', null, 'u-001', ['auth', 'security'], 240, 0, null, 'Authenticator app enrollment and recovery codes.'],
  [24, D, 'p-104', 'Audit password reset emails', 'todo', 'medium', 10, 'u-005', ['security', 'backend'], 60, 0, null, 'Confirm tokens expire and cannot be reused.'],
  // Mobile App Beta
  [25, D, 'p-105', 'Prototype bottom navigation', 'backlog', 'medium', null, 'u-014', ['design', 'mobile'], 90, 0, null, 'Five-tab navigation with a quick-add action.'],
  [26, D, 'p-105', 'Evaluate offline sync strategy', 'todo', 'medium', 12, 'u-001', ['architecture'], 120, 0, null, 'Compare queue-based sync and conflict resolution options.'],
  // Documentation Portal
  [27, D, 'p-106', 'Write onboarding guide', 'completed', 'medium', -2, 'u-001', ['documentation'], 120, 110, 2, 'A ten-minute guide for new team members.'],
  [28, D, 'p-106', 'Publish API reference site', 'completed', 'high', -1, 'u-004', ['documentation', 'deployment'], 150, 140, 1, 'Deploy the generated reference to the docs domain.'],
  [29, D, 'p-106', 'Record product walkthrough video', 'completed', 'low', 0, 'u-001', ['documentation'], 60, 55, 0, 'A five-minute tour of the workspace for the docs home page.'],
  // Workspace-level
  [30, D, null, 'Prepare sprint demo slides', 'todo', 'medium', 0, 'u-001', ['planning'], 60, 0, null, 'Summarize shipped work and metrics for Friday’s demo.'],
  [31, D, null, 'Reply to design feedback', 'completed', 'low', 0, 'u-001', ['communication'], 20, 25, 0, 'Respond to comments on the dashboard mockups.'],
  [32, D, null, 'Weekly team sync notes', 'archived', 'low', null, 'u-001', ['planning'], 30, 30, null, 'Notes and decisions from last week’s sync.'],
  [33, D, null, 'Plan quarterly roadmap review', 'todo', 'high', 9, 'u-003', ['planning'], 120, 0, null, 'Gather metrics and draft the Q4 priorities.'],
  [34, D, null, 'Refactor shared utility functions', 'in_progress', 'low', 3, 'u-001', ['refactor'], 90, 35, null, 'Consolidate date and formatting helpers.'],
  [35, D, 'p-101', 'Update dependency versions', 'completed', 'low', -4, 'u-001', ['maintenance'], 45, 40, 4, 'Bump patch and minor versions and run the full test suite.'],
  [36, D, 'p-102', 'Fix flaky login test', 'completed', 'medium', -7, 'u-001', ['testing', 'bug'], 60, 75, 7, 'Race condition between form submit and redirect.'],
  [37, D, 'p-102', 'Write unit tests for date helpers', 'completed', 'medium', -8, 'u-001', ['testing'], 90, 85, 8, 'Cover time zones, month boundaries and daylight saving.'],
  [38, D, 'p-101', 'Set up error monitoring', 'completed', 'high', -10, 'u-001', ['deployment', 'backend'], 100, 110, 10, 'Capture unhandled errors with release tagging.'],
  [39, D, 'p-102', 'Review pull request: search filters', 'completed', 'low', -1, 'u-001', ['review'], 30, 35, 1, 'Feedback on filter state and URL syncing.'],
  [40, D, 'p-102', 'Implement dark mode toggle', 'completed', 'medium', -11, 'u-001', ['react', 'ui'], 75, 80, 11, 'Persist theme choice and respect the system setting.'],
  // Nova Labs
  [41, N, 'p-201', 'Design service mesh routing', 'in_progress', 'high', 5, 'u-009', ['architecture', 'nestjs'], 240, 90, null, 'Routing rules and retries between core services.'],
  [42, N, 'p-201', 'Migrate user service to NestJS', 'in_progress', 'urgent', 2, 'u-001', ['nestjs', 'backend'], 360, 210, null, 'Move controllers and guards without downtime.'],
  [43, N, 'p-202', 'Draft Stripe billing integration spec', 'todo', 'medium', 14, 'u-012', ['api', 'documentation'], 150, 0, null, 'Webhooks, invoices and failed payment handling.'],
  [44, N, 'p-203', 'Add distributed tracing to gateway', 'review', 'high', 3, 'u-015', ['observability'], 180, 170, null, 'Propagate trace context across all upstream calls.'],
  [45, N, 'p-203', 'Create latency dashboards', 'completed', 'medium', -5, 'u-016', ['observability'], 120, 125, 5, 'p50, p95 and p99 latency by endpoint.'],
  [46, N, 'p-204', 'Build admin console shell', 'todo', 'medium', 10, 'u-001', ['react', 'ui'], 240, 0, null, 'Navigation, breadcrumbs and permission-aware layout.'],
  [47, N, 'p-204', 'Set up feature flag service', 'backlog', 'low', null, 'u-018', ['architecture'], 150, 0, null, 'Gradual rollouts with per-workspace targeting.'],
  [48, N, 'p-201', 'Load test checkout flow', 'todo', 'high', 6, 'u-019', ['testing', 'performance'], 120, 0, null, 'Simulate peak traffic and record bottlenecks.'],
  // Design Guild
  [49, G, 'p-301', 'Finalize logo lockups', 'review', 'high', 2, 'u-010', ['design', 'branding'], 120, 100, null, 'Horizontal, stacked and icon-only versions.'],
  [50, G, 'p-301', 'Export brand asset kit', 'todo', 'medium', 7, 'u-011', ['design', 'branding'], 90, 0, null, 'SVG, PNG and usage guidelines in one package.'],
  [51, G, 'p-302', 'Synthesize interview notes', 'in_progress', 'medium', 4, 'u-014', ['research'], 180, 75, null, 'Cluster findings from twelve customer interviews.'],
  [52, G, 'p-302', 'Tag research insights', 'completed', 'low', -3, 'u-015', ['research'], 60, 65, 3, 'Add consistent tags so insights are searchable.'],
  // Open Source Crew
  [53, O, 'p-401', 'Add shell completion to CLI', 'in_progress', 'medium', 5, 'u-016', ['cli', 'nodejs'], 150, 60, null, 'Bash, zsh and fish completion scripts.'],
  [54, O, 'p-402', 'Define plugin manifest schema', 'todo', 'high', 8, 'u-017', ['architecture', 'documentation'], 120, 0, null, 'Versioned JSON schema with validation errors.'],
  [55, O, 'p-401', 'Publish v1.2 release notes', 'completed', 'medium', -6, 'u-003', ['documentation'], 45, 50, 6, 'Highlights, migration notes and contributor credits.'],
  // Personal
  [56, P, 'p-501', 'Complete NestJS guards chapter', 'in_progress', 'medium', 1, 'u-001', ['learning', 'nestjs'], 90, 40, null, 'Read the chapter and rebuild the role guard example.'],
  [57, P, 'p-501', 'Build sample REST module', 'todo', 'medium', 4, 'u-001', ['learning', 'nestjs'], 180, 0, null, 'A small CRUD module with validation pipes.'],
  [58, P, null, 'Renew domain and hosting', 'todo', 'high', 3, 'u-001', ['admin'], 20, 0, null, 'Renewal notice arrives this week; confirm the payment method.'],
  [59, P, null, 'Plan weekend reading list', 'backlog', 'low', null, 'u-001', ['personal'], 15, 0, null, 'Pick two books and one long article.'],
  [60, P, null, 'Morning workout routine', 'completed', 'low', 0, 'u-001', ['health'], 40, 40, 0, '35 minutes of strength and mobility.'],
];

const CATEGORY_BY_PROJECT: Record<string, string> = {
  'p-101': 'Engineering',
  'p-102': 'Engineering',
  'p-103': 'Design',
  'p-104': 'Security',
  'p-105': 'Product',
  'p-106': 'Documentation',
  'p-201': 'Engineering',
  'p-202': 'Product',
  'p-203': 'Operations',
  'p-204': 'Engineering',
  'p-301': 'Design',
  'p-302': 'Research',
  'p-401': 'Engineering',
  'p-402': 'Product',
  'p-501': 'Learning',
};

const SUBTASKS: Record<number, Array<[title: string, done: boolean]>> = {
  2: [
    ['Create login endpoint', true],
    ['Create register endpoint', true],
    ['Add request validation', true],
    ['Connect refresh flow', false],
    ['Test authentication', false],
  ],
  11: [
    ['Build sidebar and top bar', true],
    ['Add stat cards', true],
    ['Add chart widgets', false],
    ['Make the layout responsive', false],
  ],
  12: [
    ['Set up drag sensors', false],
    ['Persist column order', false],
    ['Add keyboard reordering', false],
  ],
  42: [
    ['Port user controller', true],
    ['Port role guard', true],
    ['Migrate database access', false],
    ['Run parallel traffic test', false],
  ],
  56: [
    ['Read the guards chapter', true],
    ['Rebuild the role guard', false],
    ['Write two unit tests', false],
  ],
};

const toSubtasks = (n: number): Subtask[] =>
  (SUBTASKS[n] ?? []).map(([title, done], index) => ({ id: `st-${n}-${index + 1}`, title, done }));

export const SEED_TASKS: Task[] = ROWS.map(
  ([n, workspaceId, projectId, title, status, priority, dueOffset, assigneeId, tags, estimate, tracked, doneAgo, description]) => {
    const id = `tsk-${String(n).padStart(3, '0')}`;
    const spanDays = Math.max(1, Math.round(estimate / 240));
    return {
      id,
      workspaceId,
      projectId,
      title,
      description,
      status,
      priority,
      category: projectId ? (CATEGORY_BY_PROJECT[projectId] ?? 'General') : workspaceId === P ? 'Personal' : 'General',
      startDate: dueOffset === null ? null : dayOffsetIso(dueOffset - spanDays, 9),
      dueDate: dueOffset === null ? null : dayOffsetIso(dueOffset, 17),
      assigneeId,
      creatorId: workspaceId === P ? assigneeId : 'u-002',
      tags,
      subtasks: toSubtasks(n),
      estimateMinutes: estimate,
      trackedMinutes: tracked,
      completedAt: doneAgo === null ? null : dayOffsetIso(-doneAgo, 14),
      createdAt: dayOffsetIso(-(20 + (n % 15)), 10),
      updatedAt: dayOffsetIso(doneAgo === null ? -(n % 4) : -doneAgo, 12),
    };
  },
);
