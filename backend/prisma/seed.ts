/**
 * Idempotent seed that reproduces the frontend demo data.
 * Sources (do not diverge):
 *   frontend/src/data/users.ts
 *   frontend/src/data/workspaces.ts
 *
 * Run with: npx prisma db seed   (or npm run db:seed)
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
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

// ─── dates (mirror frontend/src/data/users.ts:3-4) ───────────────────────────
const BASE_TIME = Date.parse('2026-09-29T09:00:00Z');
const hoursAgo = (hours: number): Date =>
  new Date(BASE_TIME - hours * 3_600_000);

// ─── demo accounts (frontend/src/data/users.ts:7-48) ─────────────────────────
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

// ─── generated users (frontend/src/data/users.ts:50-91) ──────────────────────
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

// ─── workspaces (frontend/src/data/workspaces.ts:3-57) ───────────────────────
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

  const [users, workspaces, members] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.workspaceMember.count(),
  ]);

  console.log(
    `Seed complete: ${users} users, ${workspaces} workspaces, ${members} workspace members.`,
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
