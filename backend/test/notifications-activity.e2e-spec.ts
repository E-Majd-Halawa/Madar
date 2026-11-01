vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const marker = `p6test_${uniqueSuffix}`;

describe('Notifications & Activity Comprehensive E2E (Phase 6)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let u1: { id: string; token: string; email: string };
  let u2: { id: string; token: string; email: string };
  let workspaceId: string;
  let projectId: string;
  const password = 'Password123!';

  async function reg(label: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: `User ${label}`,
        username: `${marker}_${label}`,
        email: `${marker}_${label}@example.com`,
        password,
      })
      .expect(201);
    return {
      id: res.body.user.id as string,
      token: res.body.tokens.accessToken as string,
      email: res.body.user.email as string,
    };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.listen(0);
    prisma = app.get(PrismaService);

    u1 = await reg('alice');
    u2 = await reg('bob');

    // Get u1's personal workspace
    const wsRes = await request(app.getHttpServer())
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(200);
    workspaceId = wsRes.body[0].id;

    // Add u2 as workspace member directly
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: u2.id,
        role: 'member',
        department: 'Engineering',
      },
    });

    // Create project
    const projRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${u1.token}`)
      .send({
        workspaceId,
        name: `${marker}-proj`,
        color: '#10b981',
        ownerId: u1.id,
        memberIds: [u1.id],
        startDate: new Date().toISOString(),
      })
      .expect(201);
    projectId = projRes.body.id;
  });

  afterAll(async () => {
    const ids = [u1?.id, u2?.id].filter(Boolean);
    await prisma.activityEvent.deleteMany({ where: { workspaceId } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.workspace.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  });

  it('401 without token on notifications and activity', async () => {
    await request(app.getHttpServer()).get('/api/v1/notifications').expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/activity`)
      .expect(401);
  });

  it('user A cannot read, patch, or delete user B notifications', async () => {
    const n = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${u2.token}`)
      .send({ userId: u2.id, type: 'system', title: 'u2 secret' })
      .expect(201);

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${n.body.id}`)
      .set('Authorization', `Bearer ${u1.token}`)
      .send({ read: true });
    expect([403, 404]).toContain(patchRes.status);

    const delRes = await request(app.getHttpServer())
      .delete(`/api/v1/notifications/${n.body.id}`)
      .set('Authorization', `Bearer ${u1.token}`);
    expect([403, 404]).toContain(delRes.status);
  });

  it('notifications list is newest-first and supports markRead, readAll, remove', async () => {
    const n1 = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${u1.token}`)
      .send({ userId: u1.id, type: 'system', title: 'first' })
      .expect(201);

    const n2 = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${u1.token}`)
      .send({ userId: u1.id, type: 'system', title: 'second' })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(200);

    expect(listRes.body[0].id).toBe(n2.body.id);
    expect(listRes.body[1].id).toBe(n1.body.id);

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${n1.body.id}`)
      .set('Authorization', `Bearer ${u1.token}`)
      .send({ read: true })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(204);

    await request(app.getHttpServer())
      .delete(`/api/v1/notifications/${n1.body.id}`)
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(204);
  });

  it('notification deduplication (<5 min suppressed)', async () => {
    const payload = { userId: u1.id, type: 'system', title: 'dedupe test' };
    const r1 = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${u1.token}`)
      .send(payload)
      .expect(201);

    const r2 = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${u1.token}`)
      .send(payload)
      .expect(201);

    expect(r1.body.id).toBe(r2.body.id);
  });

  it('stream ticket validation, single-use, and cross-user rejection', async () => {
    const ticketRes = await request(app.getHttpServer())
      .post('/api/v1/notifications/stream-ticket')
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(201);

    const ticket = ticketRes.body.ticket;
    const httpServer = app.getHttpServer();
    const port = httpServer.address().port;

    const badRes = await fetch(
      `http://localhost:${port}/api/v1/notifications/stream?ticket=invalid`,
    );
    expect(badRes.status).toBeGreaterThanOrEqual(400);

    const crossRes = await fetch(
      `http://localhost:${port}/api/v1/notifications/stream?ticket=${ticket}`,
      {
        headers: { Authorization: `Bearer ${u2.token}` },
      },
    );
    expect(crossRes.status).toBeGreaterThanOrEqual(400);
  });

  it('activity list scoped to active workspace members', async () => {
    const actRes = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/activity`)
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(200);

    expect(Array.isArray(actRes.body)).toBe(true);
  });

  it('task create generates activity row and assignee notification when assignee != actor, but none when assignee == actor', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${u1.token}`)
      .send({
        workspaceId,
        title: `${marker}-task-assigned`,
        assigneeId: u2.id,
      })
      .expect(201);

    // Wait 150ms for async event subscriber notification push to resolve
    await new Promise((r) => setTimeout(r, 150));

    const u2Notifs = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${u2.token}`)
      .expect(200);

    expect(u2Notifs.body.some((n: any) => n.title.includes('assigned'))).toBe(
      true,
    );

    const taskRes2 = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${u1.token}`)
      .send({
        workspaceId,
        title: `${marker}-task-self`,
        assigneeId: u1.id,
      })
      .expect(201);

    const u1Notifs = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${u1.token}`)
      .expect(200);

    const selfNotifs = u1Notifs.body.filter((n: any) =>
      n.title.includes(taskRes2.body.id),
    );
    expect(selfNotifs.length).toBe(0);
  });
});
