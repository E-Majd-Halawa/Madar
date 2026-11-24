/**
 * Promote an existing user to an admin role.
 *
 * Usage:
 *   TARGET_EMAIL=user@example.com TARGET_ROLE=admin npx tsx prisma/promote-admin.ts
 *   # or
 *   npx tsx prisma/promote-admin.ts user@example.com super_admin
 *
 * TARGET_ROLE defaults to "admin". Valid roles: user, moderator, admin, super_admin.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const email = (process.env.TARGET_EMAIL || process.argv[2] || '').trim().toLowerCase();
const role = (process.env.TARGET_ROLE || process.argv[3] || 'admin').trim();

const VALID_ROLES = new Set(['user', 'moderator', 'admin', 'super_admin']);

async function main(): Promise<void> {
  if (!email) throw new Error('TARGET_EMAIL is required');
  if (!VALID_ROLES.has(role)) throw new Error(`Invalid role: ${role}`);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) throw new Error(`User not found: ${email}`);

    const updated = await prisma.user.update({
      where: { email },
      data: { role: role as any, status: 'active', lastActiveAt: new Date() },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    console.log('Promoted user:');
    console.log(JSON.stringify(updated, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Promote failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});