import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Auth Module (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  const uniqueSuffix = Date.now().toString(36);
  const testEmail = `testuser_${uniqueSuffix}@example.com`;
  const testUsername = `user_${uniqueSuffix}`;
  const testPassword = 'Password123!';

  it('POST /api/v1/auth/register succeeds and forces role to user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test User',
        username: testUsername,
        email: testEmail,
        password: testPassword,
        role: 'super_admin', // Should be ignored and forced to 'user'
      })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.status).toBe('active');
    expect(res.body).toHaveProperty('tokens');
    expect(res.body.tokens).toHaveProperty('accessToken');
    expect(res.body.tokens).toHaveProperty('refreshToken');
    expect(res.body.tokens).toHaveProperty('expiresAt');
  });

  it('POST /api/v1/auth/register fails on duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Another User',
        username: `other_${uniqueSuffix}`,
        email: testEmail,
        password: testPassword,
      })
      .expect(409);

    expect(res.body.code).toBe('email_taken');
  });

  it('POST /api/v1/auth/register fails on duplicate username', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Another User',
        username: testUsername,
        email: `other_${uniqueSuffix}@example.com`,
        password: testPassword,
      })
      .expect(409);

    expect(res.body.code).toBe('username_taken');
  });

  it('POST /api/v1/auth/login succeeds with valid demo credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@taskflow3d.com',
        password: 'Demo123!',
      })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('demo@taskflow3d.com');
    expect(res.body.tokens).toHaveProperty('accessToken');
  });

  it('POST /api/v1/auth/login fails with invalid password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@taskflow3d.com',
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(res.body.code).toBe('invalid_credentials');
  });

  it('POST /api/v1/auth/login fails for suspended account', async () => {
    const suspendedEmail = `suspended_${uniqueSuffix}@example.com`;
    // Register user first
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Suspended User',
        username: `susp_${uniqueSuffix}`,
        email: suspendedEmail,
        password: testPassword,
      })
      .expect(201);

    // Update status to suspended in DB
    await prisma.user.update({
      where: { email: suspendedEmail },
      data: { status: 'suspended' },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: suspendedEmail,
        password: testPassword,
      })
      .expect(403);

    expect(res.body.code).toBe('account_suspended');
  });

  let _activeRefreshToken: string;

  it('POST /api/v1/auth/refresh rotates refresh token', async () => {
    // Login first to get a fresh refresh token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@taskflow3d.com',
        password: 'Demo123!',
      })
      .expect(200);

    const initialRefreshToken = loginRes.body.tokens.refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialRefreshToken })
      .expect(200);

    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');
    expect(refreshRes.body.refreshToken).not.toBe(initialRefreshToken);

    _activeRefreshToken = refreshRes.body.refreshToken;
  });

  it('POST /api/v1/auth/refresh detects reuse and revokes family', async () => {
    // Login again to get a fresh token to test reuse
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@taskflow3d.com',
        password: 'Admin123!',
      })
      .expect(200);

    const tokenToReuse = loginRes.body.tokens.refreshToken;

    // First use: success & rotation
    const firstRefresh = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokenToReuse })
      .expect(200);

    const rotatedToken = firstRefresh.body.refreshToken;

    // Second use of the original token (reuse attack): should fail with session_expired
    const reuseAttempt = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokenToReuse })
      .expect(401);

    expect(reuseAttempt.body.code).toBe('session_expired');

    // Trying to use the rotated token should also fail now because the family was revoked
    const rotatedAttempt = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotatedToken })
      .expect(401);

    expect(rotatedAttempt.body.code).toBe('session_expired');
  });

  it('POST /api/v1/auth/password/forgot always returns 204', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'demo@taskflow3d.com' })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'nonexistent@example.com' })
      .expect(204);
  });

  it('POST /api/v1/auth/logout succeeds', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@taskflow3d.com',
        password: 'Demo123!',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .send({ refreshToken: loginRes.body.tokens.refreshToken })
      .expect(204);
  });

  afterAll(async () => {
    await app.close();
  });
});
