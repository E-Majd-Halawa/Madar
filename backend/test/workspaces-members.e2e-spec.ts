vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
  process.env.EMAIL_DRIVER = 'log';
});

/**
 * Phase 3 E2E: workspaces, members, invitations, WorkspaceScopeGuard.
 *
 * All rows created here carry the unique `p3test_` marker. Cleanup removes
 * only those rows; seeded users/workspaces/invitations are never touched.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import {
  EmailService,
  type InvitationEmailInput,
} from '../src/common/email/email.service.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const marker = `p3test_${uniqueSuffix}`;
const password = 'Password123!';

const auth = (token: string) => `Bearer ${token}`;

interface TestUser {
  id: string;
  email: string;
  username: string;
  token: string;
}

describe('Phase 3 workspaces, members and invitations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let lastEmail: InvitationEmailInput | null = null;

  let ownerUser: TestUser;
  let adminUser: TestUser;
  let memberUser: TestUser;
  let guestUser: TestUser;
  let outsiderUser: TestUser;
  let removableUser: TestUser;
  let owner2User: TestUser;
  let inviteeUser: TestUser;
  let wrongUser: TestUser;
  let expiredUser: TestUser;
  let revokedUser: TestUser;
  let resendUser: TestUser;
  let concurrentUser: TestUser;
  let freshUser: TestUser;

  let workspaceXId: string;
  let workspaceYId: string;
  let happyInvite: { id: string; token: string };

  const tokenFromEmail = (input: InvitationEmailInput): string => {
    const token = new URL(input.acceptUrl).searchParams.get('token');
    if (!token) throw new Error('Invitation email did not contain a token');
    return token;
  };

  const accept = (userToken: string, invitationToken: string) =>
    request(app.getHttpServer())
      .post('/api/v1/invitations/accept')
      .set('Authorization', auth(userToken))
      .send({ token: invitationToken });

  const invite = async (
    workspaceId: string,
    actorToken: string,
    email: string,
    role = 'member',
    department = 'Engineering',
  ) => {
    lastEmail = null;
    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/invitations`)
      .set('Authorization', auth(actorToken))
      .send({ email, role, department });

    return {
      res,
      token: res.status === 201 && lastEmail ? tokenFromEmail(lastEmail) : null,
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const emailService = app.get(EmailService);
    vi.spyOn(emailService, 'sendInvitation').mockImplementation(
      async (input: InvitationEmailInput) => {
        lastEmail = input;
      },
    );

    const register = async (
      label: string,
      fullName: string,
    ): Promise<TestUser> => {
      const email = `${marker}_${label}@example.com`;
      const username = `${marker}_${label}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ fullName, username, email, password })
        .expect(201);

      return {
        id: res.body.user.id as string,
        email,
        username,
        token: res.body.tokens.accessToken as string,
      };
    };

    ownerUser = await register('owner', 'P3 Owner');
    adminUser = await register('admin', 'P3 Admin');
    memberUser = await register('member', 'P3 Member');
    guestUser = await register('guest', 'P3 Guest');
    outsiderUser = await register('outsider', 'P3 Outsider');
    removableUser = await register('removable', 'P3 Removable');
    owner2User = await register('owner2', 'P3 Second Owner');
    inviteeUser = await register('invitee', 'P3 Invitee');
    wrongUser = await register('wrong', 'P3 Wrong Email');
    expiredUser = await register('expired', 'P3 Expired');
    revokedUser = await register('revoked', 'P3 Revoked');
    resendUser = await register('resend', 'P3 Resend');
    concurrentUser = await register('concurrent', 'P3 Concurrent');
    freshUser = await register('fresh', 'P3 Fresh');

    const now = new Date();
    workspaceXId = `ws-${marker}-x`;
    workspaceYId = `ws-${marker}-y`;

    await prisma.workspace.create({
      data: {
        id: workspaceXId,
        name: 'P3 Test Workspace X',
        description: 'Phase 3 test workspace',
        type: 'team',
        ownerId: ownerUser.id,
        color: '#22d3ee',
        createdAt: now,
      },
    });

    const xMembers: Array<[TestUser, 'owner' | 'admin' | 'member' | 'guest']> =
      [
        [ownerUser, 'owner'],
        [adminUser, 'admin'],
        [memberUser, 'member'],
        [guestUser, 'guest'],
        [removableUser, 'member'],
        [owner2User, 'admin'],
      ];

    for (const [user, role] of xMembers) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspaceXId,
          userId: user.id,
          role,
          status: 'active',
          joinedAt: now,
        },
      });
    }

    await prisma.workspace.create({
      data: {
        id: workspaceYId,
        name: 'P3 Test Workspace Y',
        description: 'Phase 3 isolation workspace',
        type: 'team',
        ownerId: outsiderUser.id,
        color: '#a78bfa',
        createdAt: now,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspaceYId,
        userId: outsiderUser.id,
        role: 'owner',
        status: 'active',
        joinedAt: now,
      },
    });
  }, 60_000);

  afterAll(async () => {
    if (!prisma) return;

    await prisma.invitation.deleteMany({
      where: {
        OR: [
          { workspace: { owner: { email: { startsWith: marker } } } },
          { email: { startsWith: marker } },
          { workspaceId: { startsWith: `ws-${marker}` } },
        ],
      },
    });
    await prisma.workspaceMember.deleteMany({
      where: {
        OR: [
          { workspace: { owner: { email: { startsWith: marker } } } },
          { user: { email: { startsWith: marker } } },
          { workspaceId: { startsWith: `ws-${marker}` } },
        ],
      },
    });
    await prisma.workspace.deleteMany({
      where: {
        OR: [
          { owner: { email: { startsWith: marker } } },
          { id: { startsWith: `ws-${marker}` } },
        ],
      },
    });
    await prisma.securityEvent.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { user: { email: { startsWith: marker } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: marker } },
    });

    await app.close();
  }, 60_000);

  it('returns 401 without a token on every workspace-scoped route', async () => {
    const server = request(app.getHttpServer());
    const paths: Array<[string, string]> = [
      ['get', `/api/v1/workspaces/${workspaceXId}`],
      ['get', `/api/v1/workspaces/${workspaceXId}/members`],
      ['patch', `/api/v1/workspaces/${workspaceXId}/members/${memberUser.id}`],
      ['delete', `/api/v1/workspaces/${workspaceXId}/members/${memberUser.id}`],
      ['get', `/api/v1/workspaces/${workspaceXId}/invitations`],
      ['post', `/api/v1/workspaces/${workspaceXId}/invitations`],
      ['delete', `/api/v1/workspaces/${workspaceXId}/invitations/unknown`],
      ['post', `/api/v1/workspaces/${workspaceXId}/invitations/unknown/resend`],
      ['post', '/api/v1/invitations/accept'],
    ];

    for (const [method, path] of paths) {
      await (server as any)
        [method](path)
        .send({ role: 'member', email: `${marker}_none@example.com` })
        .expect(401);
    }
  });

  it('GET /workspaces returns the frontend Workspace shape, personal first', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/workspaces')
      .set('Authorization', auth(ownerUser.token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const personal = (res.body as Array<{ id: string }>).find(
      (workspace) => workspace.id === `ws-personal-${ownerUser.id}`,
    );
    expect(personal).toBeDefined();
    expect(res.body[0].id).toBe(personal?.id);

    const team = (res.body as Array<Record<string, unknown>>).find(
      (workspace) => workspace.id === workspaceXId,
    );
    expect(team).toMatchObject({
      type: 'team',
      ownerId: ownerUser.id,
    });
    expect(team?.memberIds).toEqual(
      expect.arrayContaining([
        ownerUser.id,
        adminUser.id,
        memberUser.id,
        guestUser.id,
      ]),
    );
    expect(typeof team?.createdAt).toBe('string');
    expect(Object.keys(team ?? {}).sort()).toEqual([
      'color',
      'createdAt',
      'description',
      'id',
      'memberIds',
      'name',
      'ownerId',
      'type',
    ]);
  });

  it('GET /workspaces/:id is member-only and hides unknown workspaces', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}`)
      .set('Authorization', auth(ownerUser.token))
      .expect(200);

    const nonMember = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}`)
      .set('Authorization', auth(outsiderUser.token))
      .expect(403);
    expect(nonMember.body.code).toBe('not_a_member');

    const unknown = await request(app.getHttpServer())
      .get('/api/v1/workspaces/ws-does-not-exist-p3')
      .set('Authorization', auth(ownerUser.token))
      .expect(403);
    expect(unknown.body.code).toBe('not_a_member');

    const personalId = `ws-personal-${ownerUser.id}`;
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${personalId}`)
      .set('Authorization', auth(ownerUser.token))
      .expect(200);
    const personalNonMember = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${personalId}`)
      .set('Authorization', auth(outsiderUser.token))
      .expect(403);
    expect(personalNonMember.body.code).toBe('not_a_member');
  });

  it('creates exactly one personal workspace for a new user, even concurrently', async () => {
    const personalId = `ws-personal-${freshUser.id}`;
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: personalId },
    });
    await prisma.workspace.deleteMany({ where: { id: personalId } });

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .get('/api/v1/workspaces')
        .set('Authorization', auth(freshUser.token)),
      request(app.getHttpServer())
        .get('/api/v1/workspaces')
        .set('Authorization', auth(freshUser.token)),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body[0].id).toBe(personalId);
    expect(first.body[0].memberIds).toContain(freshUser.id);

    const workspaceCount = await prisma.workspace.count({
      where: { ownerId: freshUser.id, type: 'personal' },
    });
    const membershipCount = await prisma.workspaceMember.count({
      where: { workspaceId: personalId, userId: freshUser.id },
    });
    expect(workspaceCount).toBe(1);
    expect(membershipCount).toBe(1);

    const third = await request(app.getHttpServer())
      .get('/api/v1/workspaces')
      .set('Authorization', auth(freshUser.token))
      .expect(200);
    expect(third.body[0].id).toBe(personalId);
    expect(
      await prisma.workspace.count({
        where: { ownerId: freshUser.id, type: 'personal' },
      }),
    ).toBe(1);
  });

  it('GET /members is readable by every active member and matches the frontend shape', async () => {
    const asGuest = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(guestUser.token))
      .expect(200);

    const ownerRow = (asGuest.body as Array<Record<string, unknown>>).find(
      (row) => row.id === ownerUser.id,
    );
    expect(ownerRow).toMatchObject({
      id: ownerUser.id,
      fullName: 'P3 Owner',
      username: ownerUser.username,
      email: ownerUser.email,
      role: 'owner',
      department: '',
      status: 'active',
    });
    expect(typeof ownerRow?.joinedAt).toBe('string');
    expect(typeof ownerRow?.lastActiveAt).toBe('string');
    expect(ownerRow).not.toHaveProperty('passwordHash');

    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(memberUser.token))
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(adminUser.token))
      .expect(200);

    const outsider = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(outsiderUser.token))
      .expect(403);
    expect(outsider.body.code).toBe('not_a_member');
  });

  it('enforces workspace roles for invitations and role changes', async () => {
    const guestInvite = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(guestUser.token))
      .send({ email: `${marker}_guest_invite@example.com`, role: 'member' })
      .expect(403);
    expect(guestInvite.body.code).toBe('insufficient_workspace_role');

    const memberList = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(memberUser.token))
      .expect(403);
    expect(memberList.body.code).toBe('insufficient_workspace_role');

    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(adminUser.token))
      .expect(200);

    const guestPatch = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${memberUser.id}`)
      .set('Authorization', auth(guestUser.token))
      .send({ role: 'admin' })
      .expect(403);
    expect(guestPatch.body.code).toBe('insufficient_workspace_role');
  });

  it('invites a member, stores only a token hash, and lists the pending invite', async () => {
    const result = await invite(
      workspaceXId,
      ownerUser.token,
      inviteeUser.email,
      'member',
      'Engineering',
    );

    expect(result.res.status).toBe(201);
    expect(result.res.body).toMatchObject({
      email: inviteeUser.email,
      role: 'member',
      department: 'Engineering',
      invitedBy: ownerUser.id,
    });
    expect(typeof result.res.body.id).toBe('string');
    expect(typeof result.res.body.invitedAt).toBe('string');
    expect(result.res.body).not.toHaveProperty('tokenHash');
    expect(result.res.body).not.toHaveProperty('token');
    expect(result.res.body).not.toHaveProperty('status');
    expect(result.res.body).not.toHaveProperty('expiresAt');

    const row = await prisma.invitation.findUniqueOrThrow({
      where: { id: result.res.body.id as string },
    });
    expect(row.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(row.tokenHash).not.toBe(result.token);
    expect(JSON.stringify(result.res.body)).not.toContain(result.token ?? '');
    expect(row.status).toBe('pending');
    expect(row.acceptedAt).toBeNull();
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(lastEmail).toMatchObject({
      to: inviteeUser.email,
      workspaceName: 'P3 Test Workspace X',
      inviterName: 'P3 Owner',
      role: 'member',
    });
    expect(lastEmail?.acceptUrl).toContain('/accept-invite?token=');

    happyInvite = {
      id: result.res.body.id as string,
      token: result.token as string,
    };

    const ownerList = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .expect(200);
    expect(
      (ownerList.body as Array<{ id: string }>).map((row) => row.id),
    ).toContain(happyInvite.id);

    const adminList = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(adminUser.token))
      .expect(200);
    expect(
      (adminList.body as Array<{ id: string }>).map((row) => row.id),
    ).toContain(happyInvite.id);
  });

  it('rejects duplicate, existing-member and owner invitations', async () => {
    const duplicate = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .send({ email: inviteeUser.email, role: 'member' })
      .expect(409);
    expect(duplicate.body.code).toBe('already_invited');

    const existingMember = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .send({ email: adminUser.email, role: 'member' })
      .expect(409);
    expect(existingMember.body.code).toBe('already_member');

    const ownerRole = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .send({ email: `${marker}_owner_role@example.com`, role: 'owner' })
      .expect(400);
    expect(ownerRole.body.code).toBe('invalid_role');
  });

  it('rejects accepting an invitation sent to another email', async () => {
    const result = await invite(
      workspaceXId,
      ownerUser.token,
      wrongUser.email,
      'member',
    );
    expect(result.res.status).toBe(201);

    const res = await accept(guestUser.token, result.token as string);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('invitation_email_mismatch');

    await request(app.getHttpServer())
      .delete(
        `/api/v1/workspaces/${workspaceXId}/invitations/${result.res.body.id as string}`,
      )
      .set('Authorization', auth(ownerUser.token))
      .expect(204);
  });

  it('returns 410 for an expired invitation and marks it expired', async () => {
    const result = await invite(
      workspaceXId,
      ownerUser.token,
      expiredUser.email,
      'member',
    );
    expect(result.res.status).toBe(201);

    await prisma.invitation.update({
      where: { id: result.res.body.id as string },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    const res = await accept(expiredUser.token, result.token as string);
    expect(res.status).toBe(410);
    expect(res.body.code).toBe('invitation_expired');

    const row = await prisma.invitation.findUniqueOrThrow({
      where: { id: result.res.body.id as string },
    });
    expect(row.status).toBe('expired');
  });

  it('returns 404 for revoked and unknown invitation tokens', async () => {
    const result = await invite(
      workspaceXId,
      ownerUser.token,
      revokedUser.email,
      'member',
    );
    expect(result.res.status).toBe(201);

    await request(app.getHttpServer())
      .delete(
        `/api/v1/workspaces/${workspaceXId}/invitations/${result.res.body.id as string}`,
      )
      .set('Authorization', auth(ownerUser.token))
      .expect(204);

    const revoked = await accept(revokedUser.token, result.token as string);
    expect(revoked.status).toBe(404);
    expect(revoked.body.code).toBe('invitation_not_found');

    const unknown = await accept(revokedUser.token, 'unknown-token-p3');
    expect(unknown.status).toBe(404);
    expect(unknown.body.code).toBe('invitation_not_found');
  });

  it('accepts an invitation, creates one member, and is idempotent', async () => {
    const res = await accept(inviteeUser.token, happyInvite.token);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workspaceXId);
    expect(res.body.memberIds).toContain(inviteeUser.id);

    const invitation = await prisma.invitation.findUniqueOrThrow({
      where: { id: happyInvite.id },
    });
    expect(invitation.status).toBe('accepted');
    expect(invitation.acceptedAt).not.toBeNull();

    const membership = await prisma.workspaceMember.findUniqueOrThrow({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceXId,
          userId: inviteeUser.id,
        },
      },
    });
    expect(membership.role).toBe('member');
    expect(membership.department).toBe('Engineering');
    expect(membership.status).toBe('active');

    const membersAsInvitee = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(inviteeUser.token))
      .expect(200);
    expect(
      (membersAsInvitee.body as Array<{ id: string }>).map((row) => row.id),
    ).toContain(inviteeUser.id);

    const second = await accept(inviteeUser.token, happyInvite.token);
    expect(second.status).toBe(200);

    const memberCount = await prisma.workspaceMember.count({
      where: { workspaceId: workspaceXId, userId: inviteeUser.id },
    });
    expect(memberCount).toBe(1);

    const afterAccept = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .expect(200);
    expect(
      (afterAccept.body as Array<{ id: string }>).map((row) => row.id),
    ).not.toContain(happyInvite.id);
  });

  it('lets a member leave, then immediately blocks workspace access', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceXId}/members/${inviteeUser.id}`)
      .set('Authorization', auth(inviteeUser.token))
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(inviteeUser.token))
      .expect(403);
    expect(res.body.code).toBe('not_a_member');
  });

  it('handles two concurrent accepts without creating duplicate memberships', async () => {
    const result = await invite(
      workspaceXId,
      ownerUser.token,
      concurrentUser.email,
      'member',
    );
    expect(result.res.status).toBe(201);

    const [first, second] = await Promise.all([
      accept(concurrentUser.token, result.token as string),
      accept(concurrentUser.token, result.token as string),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const count = await prisma.workspaceMember.count({
      where: { workspaceId: workspaceXId, userId: concurrentUser.id },
    });
    expect(count).toBe(1);
  });

  it('rotates the token on resend and invalidates the old one', async () => {
    const result = await invite(
      workspaceXId,
      ownerUser.token,
      resendUser.email,
      'member',
    );
    expect(result.res.status).toBe(201);
    const oldToken = result.token as string;

    lastEmail = null;
    await request(app.getHttpServer())
      .post(
        `/api/v1/workspaces/${workspaceXId}/invitations/${result.res.body.id as string}/resend`,
      )
      .set('Authorization', auth(ownerUser.token))
      .expect(204);

    const resentEmail = lastEmail;
    if (!resentEmail) throw new Error('Resend did not emit an email');
    const newToken = tokenFromEmail(resentEmail);
    expect(newToken).not.toBe(oldToken);

    const oldAttempt = await accept(resendUser.token, oldToken);
    expect(oldAttempt.status).toBe(404);
    expect(oldAttempt.body.code).toBe('invitation_not_found');

    const newAttempt = await accept(resendUser.token, newToken);
    expect(newAttempt.status).toBe(200);

    const resendAccepted = await request(app.getHttpServer())
      .post(
        `/api/v1/workspaces/${workspaceXId}/invitations/${result.res.body.id as string}/resend`,
      )
      .set('Authorization', auth(ownerUser.token))
      .expect(404);
    expect(resendAccepted.body.code).toBe('invitation_not_found');
  });

  it('isolates workspaces: guessed ids never cross the boundary', async () => {
    const crossInvite = await invite(
      workspaceYId,
      outsiderUser.token,
      `${marker}_cross@example.com`,
      'member',
    );
    expect(crossInvite.res.status).toBe(201);

    const deleteUnderX = await request(app.getHttpServer())
      .delete(
        `/api/v1/workspaces/${workspaceXId}/invitations/${crossInvite.res.body.id as string}`,
      )
      .set('Authorization', auth(ownerUser.token))
      .expect(404);
    expect(deleteUnderX.body.code).toBe('invitation_not_found');

    const patchUnderX = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${outsiderUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'member' })
      .expect(404);
    expect(patchUnderX.body.code).toBe('member_not_found');

    const readYMembers = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceYId}/members`)
      .set('Authorization', auth(ownerUser.token))
      .expect(403);
    expect(readYMembers.body.code).toBe('not_a_member');

    const readYInvites = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceYId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .expect(403);
    expect(readYInvites.body.code).toBe('not_a_member');
  });

  it('enforces owner-only owner changes and records the role_change audit', async () => {
    const promote = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${memberUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'admin' })
      .expect(200);
    expect(promote.body.role).toBe('admin');

    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${memberUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'member' })
      .expect(200);

    const adminGrantsOwner = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${memberUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .send({ role: 'owner' })
      .expect(403);
    expect(adminGrantsOwner.body.code).toBe('insufficient_workspace_role');

    const adminModifiesOwner = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${ownerUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .send({ role: 'member' })
      .expect(403);
    expect(adminModifiesOwner.body.code).toBe('insufficient_workspace_role');

    const adminRemovesOwner = await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceXId}/members/${ownerUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .expect(403);
    expect(adminRemovesOwner.body.code).toBe('insufficient_workspace_role');

    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${owner2User.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'owner' })
      .expect(200);

    const adminModifiesSecondOwner = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${owner2User.id}`)
      .set('Authorization', auth(adminUser.token))
      .send({ role: 'admin' })
      .expect(403);
    expect(adminModifiesSecondOwner.body.code).toBe(
      'insufficient_workspace_role',
    );

    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${owner2User.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'admin' })
      .expect(200);

    const events = await prisma.securityEvent.findMany({
      where: { userId: ownerUser.id, type: 'role_change' },
      orderBy: { createdAt: 'asc' },
    });
    expect(events.length).toBeGreaterThanOrEqual(4);
    expect(events[0]?.descriptionKey).toBe('security.workspace_role_changed');
  });

  it('lets an admin manage member/guest but not another admin', async () => {
    const guestToMember = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${guestUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .send({ role: 'member' })
      .expect(200);
    expect(guestToMember.body.role).toBe('member');

    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${guestUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .send({ role: 'guest' })
      .expect(200);

    const adminModifiesAdmin = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${owner2User.id}`)
      .set('Authorization', auth(adminUser.token))
      .send({ role: 'member' })
      .expect(403);
    expect(adminModifiesAdmin.body.code).toBe('insufficient_workspace_role');

    await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceXId}/members/${removableUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .expect(204);

    const removed = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(removableUser.token))
      .expect(403);
    expect(removed.body.code).toBe('not_a_member');

    await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceXId}/members/${guestUser.id}`)
      .set('Authorization', auth(adminUser.token))
      .expect(204);

    const guestRemoved = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(guestUser.token))
      .expect(403);
    expect(guestRemoved.body.code).toBe('not_a_member');
  });

  it('protects the last owner from demotion and removal', async () => {
    const demoteLastOwner = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceXId}/members/${ownerUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'member' })
      .expect(409);
    expect(demoteLastOwner.body.code).toBe('cannot_remove_last_owner');

    const removeLastOwner = await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceXId}/members/${ownerUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .expect(409);
    expect(removeLastOwner.body.code).toBe('cannot_remove_last_owner');
  });

  it('restricts invitations, role changes and owner removal in personal workspaces', async () => {
    const personalId = `ws-personal-${ownerUser.id}`;

    const roleChange = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${personalId}/members/${ownerUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .send({ role: 'member' })
      .expect(409);
    expect(roleChange.body.code).toBe('personal_workspace_restricted');

    const invitation = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${personalId}/invitations`)
      .set('Authorization', auth(ownerUser.token))
      .send({ email: `${marker}_personal@example.com`, role: 'member' })
      .expect(409);
    expect(invitation.body.code).toBe('personal_workspace_restricted');

    const removal = await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${personalId}/members/${ownerUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .expect(409);
    expect(removal.body.code).toBe('personal_workspace_restricted');
  });

  it('removes an admin as owner; the removed admin loses access immediately', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceXId}/members/${adminUser.id}`)
      .set('Authorization', auth(ownerUser.token))
      .expect(204);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceXId}/members`)
      .set('Authorization', auth(adminUser.token))
      .expect(403);
    expect(res.body.code).toBe('not_a_member');
  });
});
