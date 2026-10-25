vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
});

/**
 * Users Module E2E tests. A9 compliant.
 * All rows created here use the "test_users_" marker and cleanup targets only
 * that marker.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const marker = `test_users_${uniqueSuffix}`;
const testEmail = `${marker}@example.com`;
const testUsername = marker;
const testPassword = 'Password123!';

describe('Users Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test Users User',
        username: testUsername,
        email: testEmail,
        password: testPassword,
      })
      .expect(201);

    userToken = regRes.body.tokens.accessToken as string;
    testUserId = regRes.body.user.id as string;

    // Promote the test-created user, then log in again so the token carries
    // the admin role. Seeded users are never touched.
    await prisma.user.update({
      where: { id: testUserId },
      data: { role: 'admin' },
    });
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    adminToken = adminLoginRes.body.tokens.accessToken as string;
  });

  afterAll(async () => {
    await prisma.securityEvent.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.workspaceMember.deleteMany({
      where: { workspace: { owner: { email: { startsWith: marker } } } },
    });
    await prisma.workspaceMember.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.workspace.deleteMany({
      where: { owner: { email: { startsWith: marker } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: marker } },
    });
    await app.close();
  });

  it('GET /users returns 401 without token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(401);
    expect(res.body).toHaveProperty('code');
  });

  it('GET /users is available to every authenticated role (directory)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('GET /users returns Paged<User> without passwordHash', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(5);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(5);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(JSON.stringify(res.body)).not.toContain('password_hash');
  });

  it('GET /users paginates correctly (page 2 has different IDs)', async () => {
    const p1 = await request(app.getHttpServer())
      .get('/api/v1/users?page=1&pageSize=3')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const p2 = await request(app.getHttpServer())
      .get('/api/v1/users?page=2&pageSize=3')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const ids1 = (p1.body.items as Array<{ id: string }>).map((u) => u.id);
    const ids2 = (p2.body.items as Array<{ id: string }>).map((u) => u.id);
    expect(ids1.filter((id) => ids2.includes(id))).toHaveLength(0);
  });

  it('GET /users?role=admin returns only admin-role users', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users?role=admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    for (const user of res.body.items as Array<{ role: string }>) {
      expect(user.role).toBe('admin');
    }
  });

  it('GET /users?query= searches fullName, username and email', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/users?query=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].id).toBe(testUserId);
    expect(res.body.items[0].username).toBe(testUsername);
  });

  it('GET /users rejects pageSize above 100', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users?pageSize=101')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    expect(res.body.code).toBe('validation_error');
  });

  it('GET /users/:id returns user without passwordHash', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.id).toBe(testUserId);
    expect(res.body.email).toBe(testEmail);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('GET /users/:id returns 404 not_found for unknown id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/u-absolutely-never-exists-xyz')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
    expect(res.body.code).toBe('not_found');
  });
});
