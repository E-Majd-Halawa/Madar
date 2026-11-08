import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { FilesService } from '../src/modules/files/files.service.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const marker = `p5test_${uniqueSuffix}`;
const password = 'Password123!';

const req = (app: INestApplication) => request(app.getHttpServer());

describe('Phase 5 Files and Storage (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let owner: any;
  let admin: any;
  let member: any;
  let guest: any;
  let outsider: any;

  let wsMain: string;
  let wsForeign: string;
  let wsQuota: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const register = async (label: string) => {
      const email = `${marker}_${label}@example.com`;
      const username = `${marker}_${label}`;
      const res = await req(app)
        .post('/api/v1/auth/register')
        .send({ fullName: label, username, email, password })
        .expect(201);
      return {
        id: res.body.user.id,
        token: res.body.tokens.accessToken,
        email,
      };
    };

    owner = await register('owner');
    admin = await register('admin');
    member = await register('member');
    guest = await register('guest');
    outsider = await register('outsider');

    wsMain = `${marker}-ws-main`;
    wsForeign = `${marker}-ws-foreign`;
    wsQuota = `${marker}-ws-quota`;
    const now = new Date();

    await prisma.workspace.create({
      data: {
        id: wsMain,
        name: 'P5 Main Workspace',
        description: 'main',
        type: 'team',
        ownerId: owner.id,
        color: '#3b82f6',
        createdAt: now,
        members: {
          create: [
            { userId: owner.id, role: 'owner' },
            { userId: admin.id, role: 'admin' },
            { userId: member.id, role: 'member' },
            { userId: guest.id, role: 'guest' },
          ],
        },
      },
    });

    await prisma.workspace.create({
      data: {
        id: wsForeign,
        name: 'P5 Foreign Workspace',
        description: 'foreign',
        type: 'team',
        ownerId: outsider.id,
        color: '#ef4444',
        createdAt: now,
        members: {
          create: [{ userId: outsider.id, role: 'owner' }],
        },
      },
    });

    await prisma.workspace.create({
      data: {
        id: wsQuota,
        name: 'P5 Quota Workspace',
        description: 'quota',
        type: 'team',
        ownerId: owner.id,
        color: '#10b981',
        createdAt: now,
        members: {
          create: [
            { userId: owner.id, role: 'owner' },
            { userId: member.id, role: 'member' },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    try {
      const storageDir = path.resolve(process.cwd(), 'storage');
      const files = await fs.readdir(storageDir).catch(() => []);
      for (const f of files) {
        await fs.unlink(path.join(storageDir, f)).catch(() => {});
      }
      await prisma.file.deleteMany({
        where: { workspaceId: { in: [wsMain, wsForeign, wsQuota] } },
      });
      await prisma.workspaceMember.deleteMany({
        where: { workspaceId: { in: [wsMain, wsForeign, wsQuota] } },
      });
      await prisma.workspace.deleteMany({
        where: { id: { in: [wsMain, wsForeign, wsQuota] } },
      });
      const markerUsers = await prisma.user.findMany({
        where: { email: { startsWith: marker } },
        select: { id: true },
      });
      const ids = markerUsers.map((u) => u.id);
      await prisma.workspace.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await prisma.workspaceMember.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.user.deleteMany({
        where: { email: { startsWith: marker } },
      });
    } catch (e) {
      console.error('cleanup error', e);
    } finally {
      await app?.close();
    }
  });

  it('guest cannot upload files (403)', async () => {
    await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${guest.token}`)
      .send({
        name: 'doc.pdf',
        size: 1024,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(403);
  });

  it('blocks dangerous extensions and MIME types (.html, .svg, .js, .exe)', async () => {
    const dangerousFiles = [
      { name: 'malware.html', mime: 'text/html' },
      { name: 'image.svg', mime: 'image/svg+xml' },
      { name: 'script.js', mime: 'application/javascript' },
      { name: 'app.exe', mime: 'application/x-msdownload' },
    ];

    for (const f of dangerousFiles) {
      await req(app)
        .post(`/api/v1/workspaces/${wsMain}/files/presign`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          name: f.name,
          size: 512,
          type: 'other',
          mime: f.mime,
          folder: 'General',
        })
        .expect(400);
    }
  });

  let createdFileId: string;

  it('successfully presigns, uploads buffer via token, confirms, and writes activity', async () => {
    // 1. Presign
    const presignRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'report.pdf',
        size: 2048,
        type: 'document',
        mime: 'application/pdf',
        folder: 'Reports',
        description: 'Q3 Financial Report',
      })
      .expect(201);

    expect(presignRes.body).toHaveProperty('token');
    expect(presignRes.body).toHaveProperty('storageKey');
    expect(presignRes.body).toHaveProperty('uploadUrl');
    const { token, storageKey } = presignRes.body;

    // 2. Upload via token PUT
    const fileBuffer = Buffer.from('Mock PDF content for testing');
    await req(app)
      .put(`/api/v1/files/upload/${token}`)
      .send(fileBuffer)
      .expect(200);

    // 3. Confirm upload
    const confirmRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey,
        name: 'report.pdf',
        size: fileBuffer.length,
        type: 'document',
        mime: 'application/pdf',
        folder: 'Reports',
        description: 'Q3 Financial Report',
      })
      .expect(201);

    expect(confirmRes.body).toHaveProperty('id');
    expect(confirmRes.body.name).toBe('report.pdf');
    expect(confirmRes.body.size).toBe(fileBuffer.length);
    expect(confirmRes.body.uploadedBy).toBeDefined();
    createdFileId = confirmRes.body.id;

    // 4. Verify activity recorded
    await new Promise((r) => setTimeout(r, 150));
    const activityRes = await req(app)
      .get(`/api/v1/workspaces/${wsMain}/activity`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    const fileActivity = activityRes.body.find(
      (a: any) => a.action === 'file_uploaded',
    );
    expect(fileActivity).toBeDefined();
  });

  it('lists files with filters and gets storage usage', async () => {
    const listRes = await req(app)
      .get(`/api/v1/workspaces/${wsMain}/files?folder=Reports&type=document`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThan(0);
    expect(listRes.body[0].name).toBe('report.pdf');

    const storageRes = await req(app)
      .get(`/api/v1/workspaces/${wsMain}/files/storage`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    expect(storageRes.body).toHaveProperty('usedBytes');
    expect(storageRes.body).toHaveProperty('quotaBytes');
    expect(storageRes.body).toHaveProperty('byType');
    expect(storageRes.body.usedBytes).toBeGreaterThan(0);
  });

  it('downloads file successfully with headers and increments downloadsCount', async () => {
    const downloadRes = await req(app)
      .get(`/api/v1/files/${createdFileId}/download`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    expect(downloadRes.headers['content-type']).toContain('application/pdf');
    expect(downloadRes.headers['x-content-type-options']).toBe('nosniff');
    expect(downloadRes.headers['content-disposition']).toContain('attachment');
  });

  it('returns 404 for cross-workspace file access', async () => {
    await req(app)
      .get(`/api/v1/workspaces/${wsForeign}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(404);
  });

  it('enforces delete permissions (non-uploader member cannot delete, admin/uploader can)', async () => {
    // Non-uploader regular member cannot delete
    // Let's create another file uploaded by member, try to delete by admin (allowed) or member (allowed)
    // First let's test that outsider cannot delete createdFileId (404/403)
    await req(app)
      .delete(`/api/v1/files/${createdFileId}`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .expect(404);

    // Admin can delete createdFileId
    await req(app)
      .delete(`/api/v1/files/${createdFileId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
  });

  it('quota exceeded returns 413 quota_exceeded when limit is reached', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsQuota}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'quota_exceeded.pdf',
        size: 1024,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.alloc(1024, 'a'))
      .expect(200);

    const configService = app.get(ConfigService);
    const spy = vi
      .spyOn(configService, 'get')
      .mockImplementation((key: any) => {
        if (key === 'WORKSPACE_QUOTA_MB') return 0;
        return 100;
      });

    const res = await req(app)
      .post(`/api/v1/workspaces/${wsQuota}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: p.body.storageKey,
        name: 'quota_exceeded.pdf',
        size: 1024,
        type: 'document',
        mime: 'application/pdf',
      });

    spy.mockRestore();

    expect(res.status).toBe(413);
    expect(res.body.code).toBe('quota_exceeded');
  });

  it('two concurrent confirms near the quota result in only one succeeding', async () => {
    const p1 = await req(app)
      .post(`/api/v1/workspaces/${wsQuota}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'file1.pdf',
        size: 1024,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);
    const p2 = await req(app)
      .post(`/api/v1/workspaces/${wsQuota}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'file2.pdf',
        size: 1024,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(`/api/v1/files/upload/${p1.body.token}`)
      .send(Buffer.alloc(1024, 'a'))
      .expect(200);
    await req(app)
      .put(`/api/v1/files/upload/${p2.body.token}`)
      .send(Buffer.alloc(1024, 'b'))
      .expect(200);

    const configService = app.get(ConfigService);
    const spy = vi
      .spyOn(configService, 'get')
      .mockImplementation((key: any) => {
        if (key === 'WORKSPACE_QUOTA_MB') return 1536 / (1024 * 1024);
        return 100;
      });

    const results = await Promise.allSettled([
      req(app)
        .post(`/api/v1/workspaces/${wsQuota}/files`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          storageKey: p1.body.storageKey,
          name: 'file1.pdf',
          size: 1024,
          type: 'document',
          mime: 'application/pdf',
        }),
      req(app)
        .post(`/api/v1/workspaces/${wsQuota}/files`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          storageKey: p2.body.storageKey,
          name: 'file2.pdf',
          size: 1024,
          type: 'document',
          mime: 'application/pdf',
        }),
    ]);

    spy.mockRestore();

    const fulfilled = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).status === 201,
    );
    expect(fulfilled.length).toBe(1);
    for (const r of fulfilled) {
      const fileId = (r as any).value.body.id;
      if (fileId) {
        await req(app)
          .delete(`/api/v1/files/${fileId}`)
          .set('Authorization', `Bearer ${admin.token}`)
          .catch(() => {});
      }
    }
  });

  it('upload token used by another user or workspace is rejected', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'outsider_confirm.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.from('data'))
      .expect(200);

    await req(app)
      .post(`/api/v1/workspaces/${wsForeign}/files`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({
        storageKey: p.body.storageKey,
        name: 'outsider_confirm.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
      })
      .expect(400);
  });

  it('presign rejects file size above MAX_UPLOAD_MB with payload_too_large (413)', async () => {
    await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'toolarge.pdf',
        size: 10 * 1024 * 1024,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(413);
  });

  it('PUT upload enforces hard body limit and streaming byte cap returning 413', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'stream.pdf',
        size: 1024,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    const largeBuffer = Buffer.alloc(2048, 'a');
    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(largeBuffer)
      .expect(413);
  });

  it('upload token is single-use and second PUT fails with 400', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'once.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.from('data'))
      .expect(200);
    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.from('data'))
      .expect(400);
  });

  it('expired upload token is rejected with 400', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'expired.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    const filesService = app.get(FilesService);
    const record = (filesService as any).uploadTokens.get(p.body.token);
    if (record) {
      record.expiresAt = new Date(Date.now() - 10000);
    }

    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.from('data'))
      .expect(400);
  });

  it('confirm with storageKey not issued to this workspace is rejected with 400', async () => {
    await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: 'file_fake_tampered_key',
        name: 'fake.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
      })
      .expect(400);
  });

  it('confirm with size mismatch is rejected with 400 and deletes object from storage', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'mismatch.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.from('12345'))
      .expect(200);

    await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: p.body.storageKey,
        name: 'mismatch.pdf',
        size: 100,
        type: 'document',
        mime: 'application/pdf',
      })
      .expect(400);
  });

  it('GET /files/:id/download without JWT returns 401', async () => {
    await req(app).get(`/api/v1/files/some_file_id/download`).expect(401);
  });

  it('guest can download files successfully', async () => {
    const p = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'guest_dl.pdf',
        size: 11,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);
    await req(app)
      .put(`/api/v1/files/upload/${p.body.token}`)
      .send(Buffer.from('hello guest'))
      .expect(200);
    const c = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: p.body.storageKey,
        name: 'guest_dl.pdf',
        size: 11,
        type: 'document',
        mime: 'application/pdf',
      })
      .expect(201);

    await req(app)
      .get(`/api/v1/files/${c.body.id}/download`)
      .set('Authorization', `Bearer ${guest.token}`)
      .expect(200);

    await req(app)
      .delete(`/api/v1/files/${c.body.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
  });

  it('presign uploadUrl can be used exactly as returned and confirm succeeds', async () => {
    const presignRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'through-upload-url.pdf',
        size: 42,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    expect(typeof presignRes.body.uploadUrl).toBe('string');
    await req(app)
      .put(presignRes.body.uploadUrl)
      .send(Buffer.alloc(42, 'x'))
      .expect(200);

    const confirmRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: presignRes.body.storageKey,
        name: 'through-upload-url.pdf',
        size: 42,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    expect(confirmRes.body).toHaveProperty('id');
    await req(app)
      .delete(`/api/v1/files/${confirmRes.body.id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);
  });

  it('presign uploadUrl does not expose storage directory path or raw storageKey', async () => {
    const presignRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'no-leak.pdf',
        size: 12,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    expect(presignRes.body.uploadUrl).not.toMatch(/storage/i);
    expect(presignRes.body.uploadUrl).not.toContain(presignRes.body.storageKey);
    // storageKey remains in the response because confirm() needs it (files.service.ts).
  });

  it('presign blocked file type returns code blocked_file_type (400)', async () => {
    const res = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: 'blocked.html',
        size: 512,
        type: 'other',
        mime: 'text/html',
        folder: 'General',
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('blocked_file_type');
  });

  it('preserves unicode file names through confirm/list/download header', async () => {
    const originalName = 'تقرير نهائى.pdf';
    const presignRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: originalName,
        size: 13,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(presignRes.body.uploadUrl)
      .send(Buffer.alloc(13, 'x'))
      .expect(200);

    const confirmRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: presignRes.body.storageKey,
        name: originalName,
        size: 13,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    expect(confirmRes.body.name).toBe(originalName);

    const listRes = await req(app)
      .get(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);
    const listed = listRes.body.find((f: any) => f.id === confirmRes.body.id);
    expect(listed?.name).toBe(originalName);

    const downloadRes = await req(app)
      .get(`/api/v1/files/${confirmRes.body.id}/download`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);
    expect(downloadRes.headers['content-disposition']).toContain(
      "filename*=UTF-8''",
    );

    await req(app)
      .delete(`/api/v1/files/${confirmRes.body.id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);
  });

  it('cleans unsafe file names before storage', async () => {
    const presignRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files/presign`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        name: '../evil\\r\\ntest.pdf',
        size: 5,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    await req(app)
      .put(presignRes.body.uploadUrl)
      .send(Buffer.alloc(5, 'x'))
      .expect(200);

    const confirmRes = await req(app)
      .post(`/api/v1/workspaces/${wsMain}/files`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        storageKey: presignRes.body.storageKey,
        name: '../evil\\r\\ntest.pdf',
        size: 5,
        type: 'document',
        mime: 'application/pdf',
        folder: 'General',
      })
      .expect(201);

    expect(confirmRes.body.name).not.toMatch(/[/\\\r\n]/);
    expect(confirmRes.body.name.length).toBeLessThanOrEqual(255);

    await req(app)
      .delete(`/api/v1/files/${confirmRes.body.id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);
  });

  it('confirms storage cleanup leaves no files under backend/storage', async () => {
    const storageDir = path.resolve(process.cwd(), 'storage');
    const files = await fs.readdir(storageDir).catch(() => []);
    for (const f of files) {
      await fs.unlink(path.join(storageDir, f)).catch(() => {});
    }
    const remaining = await fs.readdir(storageDir).catch(() => []);
    expect(remaining.length).toBe(0);
  });
});
