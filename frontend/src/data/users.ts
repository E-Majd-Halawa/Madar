import type { Role, User, UserStatus } from '@/types';

const BASE_TIME = Date.parse('2026-09-29T09:00:00Z');
const hoursAgo = (hours: number) => new Date(BASE_TIME - hours * 3_600_000).toISOString();

/** Demo credentials shown on the sign-in screen. Mock only - never ship real passwords like this. */
export const DEMO_ACCOUNTS = [
  { userId: 'u-001', email: 'demo@taskflow3d.com', password: 'Demo123!', role: 'user' },
  { userId: 'u-002', email: 'admin@taskflow3d.com', password: 'Admin123!', role: 'admin' },
  { userId: 'u-003', email: 'superadmin@taskflow3d.com', password: 'SuperAdmin123!', role: 'super_admin' },
] as const;

export const DEMO_CREDENTIALS: Record<string, (typeof DEMO_ACCOUNTS)[number]> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account) => [account.email, account]),
);

const DEMO_USERS: User[] = [
  {
    id: 'u-001',
    fullName: 'Demo User',
    username: 'demo',
    email: 'demo@taskflow3d.com',
    role: 'user',
    status: 'active',
    createdAt: hoursAgo(24 * 200),
    lastActiveAt: hoursAgo(0.2),
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
  },
];

type Seed = [fullName: string, username: string, role: Role, status?: UserStatus];

const SEEDS: Seed[] = [
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

const GENERATED_USERS: User[] = SEEDS.map(([fullName, username, role, status = 'active'], index) => ({
  id: `u-${String(index + 4).padStart(3, '0')}`,
  fullName,
  username,
  email: `${username}@example.com`,
  role,
  status,
  createdAt: hoursAgo(24 * (320 - index * 9)),
  lastActiveAt: hoursAgo(index * 5 + 1),
}));

export const SEED_USERS: User[] = [...DEMO_USERS, ...GENERATED_USERS];
