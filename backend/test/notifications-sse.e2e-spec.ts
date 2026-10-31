import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const marker = `sse4_${uniqueSuffix}`;

describe('Phase 6 notifications SSE E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let u1: any, u2: any;
  const password = 'Password123!';

  async function reg(label: string) {
    const url =
      `http://127.0.0.1:` +
      String((app as any).getHttpServer().address().port) +
      `/api/v1/auth/register`;
    const payload = {
      fullName: label,
      username: marker + '_' + label,
      email: marker + '_' + label + '@example.com',
      password,
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((x) => x.json());
    return { id: r.user.id, token: r.tokens.accessToken };
  }

  beforeAll(async () => {
    const mf: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mf.createNestApplication();
    configureApp(app);
    await app.listen(0);
    prisma = app.get(PrismaService);
    u1 = await reg('alice');
    u2 = await reg('bob');
  });

  afterAll(async () => {
    const ids = [u1.id, u2.id];
    await prisma.workspaceMember.deleteMany({ where: { userId: { in: ids } } });
    await prisma.workspace.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await app.close();
  }, 30_000);

  async function ticket(userId: any, token: string) {
    const r = await fetch(
      `http://localhost:${(app as any).getHttpServer().address().port}/api/v1/notifications/stream-ticket`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
    );
    return r.json();
  }

  it('ticket is single-use: second use fails', async () => {
    const t = await ticket(u1, u1.token);
    const port = (app as any).getHttpServer().address().port;
    await fetch(
      `http://localhost:${(app as any).getHttpServer().address().port}/api/v1/notifications/stream?ticket=${t.ticket}`,
    ).then((r) => r.body?.cancel());

    const r2 = await fetch(
      `http://localhost:${port}/api/v1/notifications/stream?ticket=${t.ticket}`,
    );
    expect(r2.status).toBeGreaterThanOrEqual(400);
  });

  it('ticket invalid -> 4xx', async () => {
    const port = (app as any).getHttpServer().address().port;
    const r = await fetch(
      `http://localhost:${port}/api/v1/notifications/stream?ticket=bad`,
    );
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it('cross-user isolation: user B cannot use A ticket', async () => {
    const t = await ticket(u1, u1.token);
    const port = (app as any).getHttpServer().address().port;
    const r = await fetch(
      `http://localhost:${port}/api/v1/notifications/stream?ticket=${t.ticket}`,
      { headers: { Authorization: `Bearer ${u2.token}` } },
    );
    expect(r.status).toBeGreaterThanOrEqual(400);
  });

  it('notification dedupe inside 5 minute window', async () => {
    const b = { userId: u1.id, type: 'system', title: 'dup title' };
    const a = await fetch(
      `http://localhost:${(app as any).getHttpServer().address().port}/api/v1/notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${u1.token}`,
        },
        body: JSON.stringify(b),
      },
    ).then((r) => r.json());
    const c = await fetch(
      `http://localhost:${(app as any).getHttpServer().address().port}/api/v1/notifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${u1.token}`,
        },
        body: JSON.stringify(b),
      },
    ).then((r) => r.json());
    expect(a.id).toBe(c.id);
  });

  it('read event and replay use Last-Event-ID', async () => {
    const port = (app as any).getHttpServer().address().port;
    const n1 = await fetch(`http://localhost:${port}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({
        userId: u1.id,
        type: 'system',
        title: 'replay n1',
      }),
    }).then((r) => r.json());
    const t = await ticket(u1, u1.token);
    const n2 = await fetch(`http://localhost:${port}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({
        userId: u1.id,
        type: 'system',
        title: 'replay n2',
      }),
    }).then((r) => r.json());
    const res = await fetch(
      `http://localhost:${port}/api/v1/notifications/stream?ticket=${t.ticket}`,
      { headers: { 'Last-Event-ID': n1.id } },
    );
    expect(res.status).toBe(200);
    const reader = (res.body as any).getReader();
    let text = '';
    for (let i = 0; i < 5; i++) {
      const chunk = await reader.read();
      if (chunk.value) {
        text += new TextDecoder().decode(chunk.value);
      }
      if (text.includes(n2.id)) break;
    }
    expect(text).toContain(n2.id);
    await reader.cancel();
  });

  it('notification state change endpoints succeed', async () => {
    const port = (app as any).getHttpServer().address().port;
    const n = await fetch(`http://localhost:${port}/api/v1/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${u1.token}`,
      },
      body: JSON.stringify({ userId: u1.id, type: 'system', title: 'state n' }),
    }).then((r) => r.json());
    const readRes = await fetch(
      `http://localhost:${port}/api/v1/notifications/${n.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${u1.token}`,
        },
        body: JSON.stringify({ read: true }),
      },
    );
    expect(readRes.status).toBe(204);
    const all = await fetch(
      `http://localhost:${port}/api/v1/notifications/read-all`,
      { method: 'POST', headers: { Authorization: `Bearer ${u1.token}` } },
    );
    expect(all.status).toBe(204);
    const del = await fetch(
      `http://localhost:${port}/api/v1/notifications/${n.id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${u1.token}` } },
    );
    expect(del.status).toBe(204);
  });
});
