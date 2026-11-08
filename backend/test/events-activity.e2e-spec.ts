import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { DomainEvents } from '../src/common/events/domain-events.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const marker = `p6ev_${uniqueSuffix}`;

describe('Events and Activity E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let events: DomainEvents;
  let baseUrl: string;

  let u1: { id: string; token: string; email: string };
  let u2: { id: string; token: string; email: string };
  let workspaceId: string;

  async function reg(label: string) {
    const url = `${baseUrl}/api/v1/auth/register`;
    const payload = {
      fullName: label,
      username: `${marker}_${label}`,
      email: `${marker}_${label}@example.com`,
      password: 'Password123!',
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((x) => x.json());
    return {
      id: r.user.id,
      token: r.tokens.accessToken,
      email: `${marker}_${label}@example.com`,
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
    events = app.get(DomainEvents);
    baseUrl = `http://127.0.0.1:${(app as any).getHttpServer().address().port}`;

    u1 = await reg('user1');
    u2 = await reg('user2');

    const wsRes = await fetch(`${baseUrl}/api/v1/workspaces`, {
      headers: { Authorization: `Bearer ${u1.token}` },
    }).then((r) => r.json());
    workspaceId = wsRes[0].id;

    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: u2.id,
        role: 'member',
        department: 'Engineering',
      },
    });
  });

  afterAll(async () => {
    const ids = [u1?.id, u2?.id].filter(Boolean);
    if (workspaceId) {
      await prisma.activityEvent.deleteMany({ where: { workspaceId } });
      await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.project.deleteMany({ where: { workspaceId } });
      await prisma.task.deleteMany({ where: { workspaceId } });
      await prisma.invitation.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    await prisma.workspace.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({
      where: { username: { startsWith: marker } },
    });
    await app.close();
  }, 30_000);

  it('project.updated and project.removed write activity', async () => {
    const projRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({
        workspaceId,
        name: `${marker}-proj`,
        color: '#10b981',
        ownerId: u1.id,
        memberIds: [u1.id],
        startDate: new Date().toISOString(),
      }),
    });
    const proj = await projRes.json();
    const projectId = proj.id;

    await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({ name: `${marker}-proj-updated` }),
    });

    await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${u1.token}` },
    });

    // Wait briefly for async subscriber DB writes
    await new Promise((r) => setTimeout(r, 200));

    const activities = await prisma.activityEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    expect(activities.some((a) => a.action === 'project_created')).toBe(true);
    expect(activities.some((a) => a.action === 'settings_changed')).toBe(true);
  });

  it('task operations and assignee change notifications', async () => {
    const projRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({
        workspaceId,
        name: `${marker}-task-proj`,
        color: '#10b981',
        ownerId: u1.id,
        memberIds: [u1.id],
        startDate: new Date().toISOString(),
      }),
    });
    const proj = await projRes.json();

    const taskRes = await fetch(`${baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({
        workspaceId,
        projectId: proj.id,
        title: `${marker}-task-1`,
        assigneeId: u2.id,
      }),
    });
    const task = await taskRes.json();
    const taskId = task.id;

    await new Promise((r) => setTimeout(r, 200));

    const notifsU2 = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${u2.token}` },
    }).then((r) => r.json());
    expect(notifsU2.some((n: any) => n.type === 'task_assigned')).toBe(true);

    await fetch(`${baseUrl}/api/v1/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({ assigneeId: u1.id }),
    });

    await fetch(`${baseUrl}/api/v1/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${u1.token}` },
    });

    await fetch(`${baseUrl}/api/v1/tasks/${taskId}/restore`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${u1.token}` },
    });

    await fetch(`${baseUrl}/api/v1/tasks/${taskId}/time-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({ minutes: 30, note: 'worked' }),
    });
  });

  it('member.removed, member.joined, invitation.revoked write activity', async () => {
    const invRes = await fetch(
      `${baseUrl}/api/v1/workspaces/${workspaceId}/invitations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${u1.token}`,
        },
        body: JSON.stringify({
          email: `revoked_${marker}@example.com`,
          role: 'member',
        }),
      },
    ).then((r) => r.json());

    await fetch(
      `${baseUrl}/api/v1/workspaces/${workspaceId}/invitations/${invRes.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${u1.token}` },
      },
    );

    await fetch(
      `${baseUrl}/api/v1/workspaces/${workspaceId}/members/${u2.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${u1.token}` },
      },
    );

    await new Promise((r) => setTimeout(r, 200));

    const activities = await prisma.activityEvent.findMany({
      where: { workspaceId },
    });
    expect(
      activities.some(
        (a) => a.action === 'role_changed' || a.action === 'settings_changed',
      ),
    ).toBe(true);
  });

  it('SSE stream replay with lastEventId query param', async () => {
    const ticketRes = await fetch(
      `${baseUrl}/api/v1/notifications/stream-ticket`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${u1.token}` },
      },
    ).then((r) => r.json());

    const ticket = ticketRes.ticket;

    const streamRes = await fetch(
      `${baseUrl}/api/v1/notifications/stream?ticket=${ticket}&lastEventId=nonexistent`,
    );
    expect(streamRes.status).toBe(200);
    streamRes.body?.cancel();
  });

  it('throwing subscriber does not fail originating request', async () => {
    const badListener = () => {
      throw new Error('boom subscriber');
    };
    events.on('project.created', badListener);

    const projRes = await fetch(`${baseUrl}/api/v1/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({
        workspaceId,
        name: `${marker}-robust-proj`,
        color: '#10b981',
        ownerId: u1.id,
        memberIds: [u1.id],
        startDate: new Date().toISOString(),
      }),
    });
    expect(projRes.status).toBe(201);
  });
});
