vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
});

// The shared development database can be remote, so allow slower auth/DB round trips.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });

/**
 * Workspace membership E2E tests. A9 compliant: every row created here carries
 * the "test_workspaces_" marker and cleanup deletes only those rows.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const marker = `test_workspaces_${uniqueSuffix}`;
const ownerUsername = `${marker}_owner`;
const memberUsername = `${marker}_member`;
const password = 'Password123!';

describe('Workspaces membership (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let memberToken: string;
  let workspaceId: string;
  let memberUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Workspace Owner',
        username: ownerUsername,
        email: `${marker}_owner@example.com`,
        password,
      })
      .expect(201);
    ownerToken = ownerRes.body.tokens.accessToken as string;

    const memberRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Workspace Candidate',
        username: memberUsername,
        email: `${marker}_member@example.com`,
        password,
      })
      .expect(201);
    memberToken = memberRes.body.tokens.accessToken as string;
    memberUserId = memberRes.body.user.id as string;

    const workspaceRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Workspace', type: 'team' })
      .expect(201);
    workspaceId = workspaceRes.body.id as string;
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

  it('owner can search candidates and receives only the public projection', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/candidate-users`)
      .query({ q: memberUsername.toUpperCase() })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const candidate = (res.body as Array<Record<string, unknown>>).find(
      (item) => item.id === memberUserId,
    );
    expect(candidate).toBeDefined();
    expect(Object.keys(candidate ?? {}).sort()).toEqual(
      ['avatar', 'id', 'name', 'username'].sort(),
    );
    expect(candidate?.username).toBe(memberUsername);
    expect(JSON.stringify(res.body)).not.toContain('@example.com');
  });

  it('adds a member by case-insensitive exact username', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ username: memberUsername.toUpperCase(), role: 'member' })
      .expect(201);

    expect(res.body.id).toBe(memberUserId);
    expect(res.body.username).toBe(memberUsername);
    expect(res.body.role).toBe('member');
  });

  it('returns 409 member_exists when the user is already a member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ username: memberUsername, role: 'member' })
      .expect(409);

    expect(res.body.code).toBe('member_exists');
  });

  it('returns 404 user_not_found for an unknown username', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ username: `${marker}_missing` })
      .expect(404);

    expect(res.body.code).toBe('user_not_found');
  });

  it('excludes existing members from candidate search', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/candidate-users`)
      .query({ q: memberUsername })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(
      (res.body as Array<{ id: string }>).some((item) => item.id === memberUserId),
    ).toBe(false);
  });

  it('rejects member management by a regular member', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/candidate-users`)
      .query({ q: ownerUsername })
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ username: ownerUsername })
      .expect(403);
  });

  it('requires the username field (email identifiers are no longer accepted)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ identifier: `${marker}_owner@example.com` })
      .expect(400);

    expect(res.body.code).toBe('validation_error');
  });
});
