vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
  process.env.ENABLE_DEMO_LOGIN = 'true';
});

/**
 * Auth Module E2E tests.
 * A9 compliant: all test rows use email/username starting with "test_auth_".
 * Cleanup deletes ONLY rows carrying that marker.
 * Seeded users are used read-only (demo endpoint test only, and its token row
 * is removed afterwards).
 */
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const marker = `test_auth_${uniqueSuffix}`;
const testEmail = `${marker}@example.com`;
const testUsername = marker;
const testPassword = 'Password123!';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let registerBody: {
    user: { id: string; role: string; status: string; email: string };
    tokens: { accessToken: string; refreshToken: string; expiresAt: number };
    isDemo: boolean;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test Auth User',
        username: testUsername,
        email: testEmail,
        password: testPassword,
        role: 'super_admin',
      })
      .expect(201);

    registerBody = res.body as typeof registerBody;
    testUserId = registerBody.user.id;
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
    await prisma.workspace.deleteMany({
      where: { owner: { email: { startsWith: marker } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: marker } },
    });
    await app.close();
  });

  it('POST /auth/register succeeds and forces role=user, status=active', async () => {
    expect(registerBody.user.role).toBe('user');
    expect(registerBody.user.status).toBe('active');
    expect(registerBody.tokens).toHaveProperty('accessToken');
    expect(registerBody.tokens).toHaveProperty('refreshToken');
    expect(registerBody.tokens.expiresAt).toBeTypeOf('number');
    expect(registerBody.isDemo).toBe(false);
    expect(JSON.stringify(registerBody)).not.toContain('passwordHash');

    // Personal workspace + owner membership, like mockWorkspaceService.ts.
    const workspace = await prisma.workspace.findUnique({
      where: { id: `ws-personal-${testUserId}` },
      include: { members: true },
    });
    expect(workspace).not.toBeNull();
    expect(workspace?.ownerId).toBe(testUserId);
    expect(workspace?.type).toBe('personal');
    expect(workspace?.members).toHaveLength(1);
    expect(workspace?.members[0]?.role).toBe('owner');
  });

  it('POST /auth/register rejects a password with fewer than 3 rules', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Weak Password',
        username: `${marker}_weak`,
        email: `${marker}_weak@example.com`,
        password: 'password',
      })
      .expect(400);
    expect(res.body.code).toBe('validation_error');
    expect(Array.isArray(res.body.fieldErrors)).toBe(true);
  });

  it('POST /auth/register accepts a password satisfying 3 of 4 frontend rules', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Policy Password',
        username: `${marker}_policy`,
        email: `${marker}_policy@example.com`,
        password: 'Password1',
      })
      .expect(201);
    expect(res.body.user.email).toBe(`${marker}_policy@example.com`);
  });

  it('POST /auth/register fails on duplicate email (email_taken)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Duplicate User',
        username: `${marker}_other`,
        email: testEmail,
        password: testPassword,
      })
      .expect(409);
    expect(res.body.code).toBe('email_taken');
  });

  it('POST /auth/register fails on duplicate username (username_taken)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Duplicate User',
        username: testUsername,
        email: `${marker}_other@example.com`,
        password: testPassword,
      })
      .expect(409);
    expect(res.body.code).toBe('username_taken');
  });

  it('POST /auth/register treats usernames case-insensitively', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Duplicate User',
        username: testUsername.toUpperCase(),
        email: `${marker}_case@example.com`,
        password: testPassword,
      })
      .expect(409);
    expect(res.body.code).toBe('username_taken');
  });

  it('POST /auth/login succeeds with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.isDemo).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const sessionEvent = await prisma.securityEvent.findFirst({
      where: { userId: testUserId, type: 'session' },
      orderBy: { createdAt: 'desc' },
    });
    expect(sessionEvent).not.toBeNull();
  });

  it('POST /auth/login fails with wrong password (invalid_credentials)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'WrongPass999!' })
      .expect(401);
    expect(res.body.code).toBe('invalid_credentials');
  });

  it('POST /auth/login fails for suspended account (account_suspended)', async () => {
    const suspEmail = `${marker}_susp@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Susp',
        username: `${marker}_susp`,
        email: suspEmail,
        password: testPassword,
      })
      .expect(201);
    await prisma.user.update({
      where: { email: suspEmail },
      data: { status: 'suspended' },
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: suspEmail, password: testPassword })
      .expect(403);
    expect(res.body.code).toBe('account_suspended');
  });

  it('POST /auth/demo sets isDemo=true', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/demo')
      .expect(200);
    expect(res.body.isDemo).toBe(true);
    expect(res.body.tokens).toHaveProperty('accessToken');

    // Remove only the refresh-token row this test created for the seeded user.
    const tokenHash = createHash('sha256')
      .update(res.body.tokens.refreshToken as string)
      .digest('hex');
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  });

  it('POST /auth/refresh rotates the token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    const initialRt = loginRes.body.tokens.refreshToken as string;
    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRt })
      .expect(200);
    expect(refreshRes.body.refreshToken).not.toBe(initialRt);
    expect(refreshRes.body.expiresAt).toBeTypeOf('number');

    const stored = await prisma.refreshToken.findMany({
      where: { userId: testUserId },
    });
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.every((row) => row.tokenHash !== initialRt)).toBe(true);
    expect(stored.every((row) => row.tokenHash.length === 64)).toBe(true);
  });

  it('POST /auth/refresh detects reuse and revokes whole family', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    const original = loginRes.body.tokens.refreshToken as string;
    const first = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: original })
      .expect(200);
    const rotated = first.body.refreshToken as string;
    const reuse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: original })
      .expect(401);
    expect(reuse.body.code).toBe('session_expired');
    const rotatedAttempt = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated })
      .expect(401);
    expect(rotatedAttempt.body.code).toBe('session_expired');

    const suspicious = await prisma.securityEvent.findFirst({
      where: { userId: testUserId, type: 'suspicious' },
      orderBy: { createdAt: 'desc' },
    });
    expect(suspicious).not.toBeNull();
  });

  it('POST /auth/logout then /auth/refresh with same token fails', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    const rt = loginRes.body.tokens.refreshToken as string;
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: rt })
      .expect(204);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rt })
      .expect(401);
    expect(res.body.code).toBe('session_expired');
  });

  it('POST /auth/password/forgot always returns 204 (existing email)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email: testEmail })
      .expect(204);
  });

  it('POST /auth/password/forgot always returns 204 (nonexistent email)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email: `${marker}_missing@example.com` })
      .expect(204);
  });

  it('GET /auth/me returns 401 without token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);
    expect(res.body).toHaveProperty('code');
  });

  it('GET /auth/me returns 401 with malformed token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.valid.jwt')
      .expect(401);
    expect(res.body).toHaveProperty('code');
  });

  it('GET /auth/me returns 401 with an expired token', async () => {
    const expired = app.get(JwtService).sign(
      {
        sub: testUserId,
        role: 'user',
        sid: 'expired-family',
      },
      { expiresIn: -10 },
    );
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
    expect(res.body).toHaveProperty('code');
  });

  it('GET /auth/me returns 401 with a tampered token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(
        'Authorization',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1LTAwMSIsInJvbGUiOiJ1c2VyIiwic2lkIjoiZiIsImV4cCI6MX0.BADSIG',
      )
      .expect(401);
    expect(res.body).toHaveProperty('code');
  });

  it('GET /auth/me returns 200 with valid token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(
        'Authorization',
        `Bearer ${loginRes.body.tokens.accessToken as string}`,
      )
      .expect(200);
    expect(res.body.user.email).toBe(testEmail);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});
