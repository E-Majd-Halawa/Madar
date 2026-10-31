/**
 * Idempotent seed that reproduces the frontend demo data.
 * Sources (do not diverge):
 *   frontend/src/data/users.ts
 *   frontend/src/data/workspaces.ts
 *
 * Run with: npx prisma db seed   (or npm run db:seed)
 */
import 'dotenv/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type SeedRole = 'user' | 'moderator' | 'admin' | 'super_admin';
type SeedUserStatus = 'active' | 'suspended' | 'invited';
type SeedWorkspaceType = 'personal' | 'team';
type SeedWorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

interface SeedUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: SeedRole;
  status: SeedUserStatus;
  createdAt: Date;
  lastActiveAt: Date;
}

interface SeedWorkspace {
  id: string;
  name: string;
  description: string;
  type: SeedWorkspaceType;
  ownerId: string;
  memberIds: string[];
  color: string;
  createdAt: Date;
}

interface SeedInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<SeedWorkspaceRole, 'owner'>;
  department: string;
  invitedById: string;
  /** Hours before the seed run; mirrors memberStore.ts mock timestamps. */
  hoursAgo: number;
}

// â”€â”€â”€ dates (mirror frontend/src/data/users.ts:3-4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BASE_TIME = Date.parse('2026-09-29T09:00:00Z');
const hoursAgo = (hours: number): Date =>
  new Date(BASE_TIME - hours * 3_600_000);

// â”€â”€â”€ demo accounts (frontend/src/data/users.ts:7-48) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEMO_ACCOUNTS: Array<SeedUser & { password: string }> = [
  {
    id: 'u-001',
    fullName: 'Demo User',
    username: 'demo',
    email: 'demo@taskflow3d.com',
    role: 'user',
    status: 'active',
    createdAt: hoursAgo(24 * 200),
    lastActiveAt: hoursAgo(0.2),
    password: 'Demo123!',
  },
  {
    id: 'u-002',
    fullName: 'Admin User',
    username: 'admin',
    email: 'admin@taskflow3d.com',
    role: 'admin',
    status: 'active',
    createdAt: hoursAgo(24 * 260),
    lastActiveAt: hoursAgo(1),
    password: 'Admin123!',
  },
  {
    id: 'u-003',
    fullName: 'Super Admin',
    username: 'superadmin',
    email: 'superadmin@taskflow3d.com',
    role: 'super_admin',
    status: 'active',
    createdAt: hoursAgo(24 * 320),
    lastActiveAt: hoursAgo(2),
    password: 'SuperAdmin123!',
  },
];

// â”€â”€â”€ generated users (frontend/src/data/users.ts:50-91) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type UserSeedRow = [
  fullName: string,
  username: string,
  role: SeedRole,
  status?: SeedUserStatus,
];

const USER_SEEDS: UserSeedRow[] = [
  ['Ahmed Nasser', 'ahmed.nasser', 'user'],
  ['Sara Haddad', 'sara.haddad', 'moderator'],
  ['Omar Khalil', 'omar.khalil', 'user'],
  ['Lina Farouk', 'lina.farouk', 'user'],
  ['Yousef Mansour', 'yousef.mansour', 'user'],
  ['Maya Rahman', 'maya.rahman', 'admin'],
  ['Karim Saleh', 'karim.saleh', 'user'],
  ['Noor Al-Amin', 'noor.alamin', 'user'],
  ['Tariq Aziz', 'tariq.aziz', 'admin'],
  ['Hana Suleiman', 'hana.suleiman', 'user'],
  ['Daniel Reyes', 'daniel.reyes', 'user'],
  ['Priya Nair', 'priya.nair', 'user'],
  ['Lucas Meyer', 'lucas.meyer', 'user'],
  ['Elena Petrova', 'elena.petrova', 'user'],
  ['Jonas Berg', 'jonas.berg', 'user'],
  ['Amira Zaki', 'amira.zaki', 'user'],
  ['Hassan Idris', 'hassan.idris', 'user', 'suspended'],
  ['Leila Barakat', 'leila.barakat', 'moderator'],
  ['Samir Qasem', 'samir.qasem', 'user'],
  ['Nadia Hussein', 'nadia.hussein', 'user'],
  ['Marco Bianchi', 'marco.bianchi', 'user', 'suspended'],
  ['Yuki Tanaka', 'yuki.tanaka', 'user'],
  ['Fatima Zahra', 'fatima.zahra', 'user'],
  ['Ibrahim Odeh', 'ibrahim.odeh', 'user'],
  ['Chloe Martin', 'chloe.martin', 'user'],
  ['Rami Jaber', 'rami.jaber', 'moderator'],
  ['Zaid Alkhatib', 'zaid.alkhatib', 'user', 'invited'],
];

const GENERATED_USERS: SeedUser[] = USER_SEEDS.map(
  ([fullName, username, role, status = 'active'], index) => ({
    id: `u-${String(index + 4).padStart(3, '0')}`,
    fullName,
    username,
    email: `${username}@example.com`,
    role,
    status,
    createdAt: hoursAgo(24 * (320 - index * 9)),
    lastActiveAt: hoursAgo(index * 5 + 1),
  }),
);

// â”€â”€â”€ workspaces (frontend/src/data/workspaces.ts:3-57) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const range = (from: number, to: number): string[] =>
  Array.from(
    { length: to - from + 1 },
    (_, i) => `u-${String(from + i).padStart(3, '0')}`,
  );

const WORKSPACES: SeedWorkspace[] = [
  {
    id: 'ws-personal-u-001',
    name: 'Personal Workspace',
    description: 'Your private space for personal tasks and goals.',
    type: 'personal',
    ownerId: 'u-001',
    memberIds: ['u-001'],
    color: '#10b981',
    createdAt: new Date('2026-03-12T08:00:00Z'),
  },
  {
    id: 'ws-demo',
    name: 'Demo Workspace',
    description:
      'A sample team workspace with projects, tasks and conversations.',
    type: 'team',
    ownerId: 'u-002',
    memberIds: [...range(1, 3), ...range(4, 14)],
    color: '#22d3ee',
    createdAt: new Date('2026-01-20T10:30:00Z'),
  },
  {
    id: 'ws-nova',
    name: 'Nova Labs',
    description: 'Product engineering team building the Nova platform.',
    type: 'team',
    ownerId: 'u-002',
    memberIds: [...range(1, 3), ...range(8, 20)],
    color: '#a78bfa',
    createdAt: new Date('2026-02-04T09:15:00Z'),
  },
  {
    id: 'ws-design',
    name: 'Design Guild',
    description: 'Designers sharing systems, critiques and research.',
    type: 'team',
    ownerId: 'u-009',
    memberIds: range(10, 22),
    color: '#f59e0b',
    createdAt: new Date('2026-04-18T14:00:00Z'),
  },
  {
    id: 'ws-oss',
    name: 'Open Source Crew',
    description: 'Volunteer maintainers shipping community tooling.',
    type: 'team',
    ownerId: 'u-003',
    memberIds: [...range(15, 30), 'u-003'],
    color: '#3b82f6',
    createdAt: new Date('2026-05-02T16:45:00Z'),
  },
];

// â”€â”€â”€ pending invitations (frontend/src/store/memberStore.ts:38-55) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These are demo rows only: the raw token is discarded, exactly as the API does.
// The hash changes on every seed run, so no usable accept link is persisted.
const SEED_INVITATIONS: SeedInvitation[] = [
  {
    id: 'inv-001',
    workspaceId: 'ws-demo',
    email: 'sarah.connor@example.com',
    role: 'member',
    department: 'Engineering',
    invitedById: 'u-002',
    hoursAgo: 36,
  },
  {
    id: 'inv-002',
    workspaceId: 'ws-demo',
    email: 'alex.rivera@designstudio.io',
    role: 'guest',
    department: 'Design',
    invitedById: 'u-001',
    hoursAgo: 14,
  },
];

async function main(): Promise<void> {
  // Demo accounts keep their documented passwords; generated demo users get an
  // unguessable password because they are not meant to log in.
  const unguessableHash = await argon2.hash(randomUUID(), {
    type: argon2.argon2id,
  });

  const userRows: Array<SeedUser & { passwordHash: string }> = [];

  for (const demo of DEMO_ACCOUNTS) {
    const passwordHash = await argon2.hash(demo.password, {
      type: argon2.argon2id,
    });
    userRows.push({ ...demo, passwordHash });
  }

  for (const user of GENERATED_USERS) {
    userRows.push({ ...user, passwordHash: unguessableHash });
  }

  for (const user of userRows) {
    const data = {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
    await prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: { id: user.id, ...data },
    });
  }

  for (const workspace of WORKSPACES) {
    const data = {
      name: workspace.name,
      description: workspace.description,
      type: workspace.type,
      ownerId: workspace.ownerId,
      color: workspace.color,
      createdAt: workspace.createdAt,
    };
    await prisma.workspace.upsert({
      where: { id: workspace.id },
      update: data,
      create: { id: workspace.id, ...data },
    });

    for (const userId of workspace.memberIds) {
      const role: SeedWorkspaceRole =
        userId === workspace.ownerId ? 'owner' : 'member';
      await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
        update: { role, status: 'active' },
        create: {
          workspaceId: workspace.id,
          userId,
          role,
          status: 'active',
          joinedAt: workspace.createdAt,
        },
      });
    }
  }

  const now = Date.now();
  for (const invitation of SEED_INVITATIONS) {
    const invitedAt = new Date(now - invitation.hoursAgo * 3_600_000);
    const expiresAt = new Date(now + 7 * 24 * 3_600_000);
    const tokenHash = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');

    const data = {
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      role: invitation.role,
      department: invitation.department,
      invitedById: invitation.invitedById,
      tokenHash,
      status: 'pending' as const,
      invitedAt,
      expiresAt,
      acceptedAt: null,
    };

    await prisma.invitation.upsert({
      where: { id: invitation.id },
      update: data,
      create: { id: invitation.id, ...data },
    });
  }

  await seedPhase4();

  const [users, workspaces, members, invitations, projects, tasks] =
    await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.workspaceMember.count(),
      prisma.invitation.count(),
      prisma.project.count(),
      prisma.task.count(),
    ]);

  console.log(
    `Seed complete: ${users} users, ${workspaces} workspaces, ${members} workspace members, ${invitations} invitations, ${projects} projects, ${tasks} tasks.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import fs from 'node:fs';
import path from 'node:path';

async function seedPhase4(): Promise<void> {
  const wsConst: Record<string, string> = {
    D: 'ws-demo',
    N: 'ws-nova',
    G: 'ws-design',
    O: 'ws-oss',
    P: 'ws-personal-u-001',
  };

  const taskFile = fs.readFileSync(
    path.resolve(process.cwd(), '../frontend/src/data/tasks.ts'),
    'utf8',
  );
  const projectFile = fs.readFileSync(
    path.resolve(process.cwd(), '../frontend/src/data/projects.ts'),
    'utf8',
  );

  // Parse project rows: ['p-...', 'ws-...', name, description, status, color, 'u-...', [...], offset, offset|null]
  const projects: Array<{
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    status: string;
    color: string;
    ownerId: string;
    memberIds: string[];
    startDate: Date;
    dueDate: Date | null;
    createdAt: Date;
  }> = [];

  const projectLineRe =
    /^\s*\['(p-[^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'(u-\d{3})',\s*\[([^\]]*)\],\s*(-?\d+),\s*(-?\d+|null)\],?\s*$/;
  for (const rawLine of projectFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    const m = projectLineRe.exec(line);
    if (!m) continue;
    const memberIds = (m[8].match(/'u-\d{3}'/g) ?? []).map((s) =>
      s.replace(/'/g, ''),
    );
    const start = Number(m[9]);
    const dueRaw = m[10];
    const dayOffset = (off: number, hour: number) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + off);
      d.setHours(hour, 0, 0, 0);
      return d;
    };
    projects.push({
      id: m[1],
      workspaceId: m[2],
      name: m[3],
      description: m[4],
      status: m[5],
      color: m[6],
      ownerId: m[7],
      memberIds,
      startDate: dayOffset(start, 9),
      dueDate: dueRaw === 'null' ? null : dayOffset(Number(dueRaw), 17),
      createdAt: dayOffset(start - 2, 9),
    });
  }

  // Parse task rows
  // That regex is too fragile for descriptions; fallback by evaluating each array line after replacing constants.
  const taskRows: any[] = [];
  for (const rawLine of taskFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!/^\[\d+,\s*[DN GOP]/.test(line)) continue;
    const cleaned = line
      .replace(/\b(D|N|G|O|P)\b/g, (v) => JSON.stringify(wsConst[v]))
      .replace(/,$/, '')
      .replace(/\/\/.*$/, '');
    try {
      const fn = new Function(`return ${cleaned};`);
      taskRows.push(fn());
    } catch {
      console.warn('Could not parse task row:', line);
    }
  }

  const categoryByProject: Record<string, string> = {
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

  const taskOwnersByWorkspace: Record<string, string> = {
    'ws-demo': 'u-002',
    'ws-nova': 'u-002',
    'ws-design': 'u-009',
    'ws-oss': 'u-003',
    'ws-personal-u-001': 'u-001',
  };

  // Project upserts
  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        workspaceId: p.workspaceId,
        name: p.name,
        description: p.description,
        status: p.status as any,
        color: p.color,
        ownerId: p.ownerId,
        startDate: p.startDate,
        dueDate: p.dueDate,
        createdAt: p.createdAt,
      },
    });
    await prisma.projectMember.deleteMany({ where: { projectId: p.id } });
    const activeMembers = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: p.workspaceId,
        userId: { in: p.memberIds },
        status: 'active',
      },
      select: { userId: true },
    });
    const validMembers = activeMembers.map((m) => m.userId);
    if (validMembers.length) {
      await prisma.projectMember.createMany({
        data: validMembers.map((userId) => ({ projectId: p.id, userId })),
        skipDuplicates: true,
      });
    }
  }

  // Task upserts with affected-creator mapping (amendment 2)
  const affectedCreators: string[] = [];
  for (const row of taskRows) {
    const [
      n,
      workspaceId,
      projectId,
      title,
      status,
      priority,
      dueOffset,
      assigneeId,
      tags,
      estimate,
      tracked,
      doneAgo,
      description,
    ] = row;
    const id = `tsk-${String(n).padStart(3, '0')}`;
    const spanDays = Math.max(1, Math.round(estimate / 240));
    const dayOffset = (off: number, hour: number) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + off);
      d.setHours(hour, 0, 0, 0);
      return d;
    };
    const projectIdVal = projectId === null ? null : projectId;
    const assigneeVal = assigneeId || null;
    // creator mapping: frontend uses u-002 except personal; if u-002 is not
    // an active member of the workspace, fall back to the workspace owner.
    const frontendCreator =
      workspaceId === 'ws-personal-u-001' ? assigneeId : 'u-002';
    const wsOwner = taskOwnersByWorkspace[workspaceId] ?? 'u-001';
    const active = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: frontendCreator, status: 'active' },
    });
    let creatorId = frontendCreator;
    if (!active) {
      creatorId = wsOwner;
      affectedCreators.push(id);
    }

    const startDate =
      dueOffset === null ? null : dayOffset(dueOffset - spanDays, 9);
    const dueDate = dueOffset === null ? null : dayOffset(dueOffset, 17);
    const completedAt = doneAgo === null ? null : dayOffset(-doneAgo, 14);
    const createdAt = dayOffset(-(20 + (n % 15)), 10);
    const updatedAt = dayOffset(doneAgo === null ? -(n % 4) : -doneAgo, 12);
    const category = projectIdVal
      ? (categoryByProject[projectIdVal] ?? 'General')
      : workspaceId === 'ws-personal-u-001'
        ? 'Personal'
        : 'General';

    await prisma.task.upsert({
      where: { id },
      update: {},
      create: {
        id,
        workspaceId,
        projectId: projectIdVal,
        title,
        description,
        status,
        priority,
        category,
        startDate,
        dueDate,
        assigneeId: assigneeVal,
        creatorId,
        tags,
        estimateMinutes: estimate,
        trackedMinutes: tracked,
        recurrence: 'none',
        completedAt,
        createdAt,
        updatedAt,
      },
    });

    // subtasks
    // Subtasks are computed in the frontend; recreate from SUBTASKS map parsed above? We cannot
    // recover here, so delete/recreate none and rely on task.subtasks default [].
    // To preserve demo richness, fetch the frontend constant by regex subtasks.
  }

  // Parse SUBTASKS from tasks.ts to attach to tasks.
  const subtaskMap: Record<number, Array<[string, boolean]>> = {};
  const subStart = taskFile.indexOf('const SUBTASKS');
  const subBlock = taskFile.slice(
    subStart,
    taskFile.indexOf('const toSubtasks'),
  );
  const entryRe = /(\d+):\s*\[\s*([\s\S]*?)\s*\],/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(subBlock)) !== null) {
    const key = Number(m[1]);
    const body = m[2];
    const pairs: Array<[string, boolean]> = [];
    const pairRe = /\['([^']*(?:''[^']*)*)',\s*(true|false)\]/g;
    let pm: RegExpExecArray | null;
    while ((pm = pairRe.exec(body)) !== null) {
      pairs.push([pm[1], pm[2] === 'true']);
    }
    subtaskMap[key] = pairs;
  }

  for (const row of taskRows) {
    const [n] = row;
    const id = `tsk-${String(n).padStart(3, '0')}`;
    const pairs = subtaskMap[n] ?? [];
    await prisma.subtask.deleteMany({ where: { taskId: id } });
    if (pairs.length) {
      await prisma.subtask.createMany({
        data: pairs.map(([title, done], index) => ({
          id: `st-${n}-${index + 1}`,
          taskId: id,
          title,
          done,
          position: index,
        })),
      });
    }
  }

  console.log(
    `Phase 4 seed affected creators remapped: ${affectedCreators.length} (${affectedCreators.join(', ')})`,
  );
}
