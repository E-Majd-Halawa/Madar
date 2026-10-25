vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
});

/**
 * Login lockout E2E tests (DB-backed, no Redis).
 * A9 compliant: only test_lock_ users are created and failed.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { PrismaService } from '../src/database/prisma.service.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const prefix = `test_lock_${uniqueSuffix}`;
const password = 'Password123!';

const emailA = `${prefix}_a@example.com`;
const emailB = `${prefix}_b@example.com`;

describe('Login lockout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const login = (email: string, pass: string) =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email,
      password: pass,
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    for (const [suffix, email] of [
      ['a', emailA],
      ['b', emailB],
    ] as const) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          fullName: `Lock ${suffix}`,
          username: `${prefix}_${suffix}`,
          email,
          password,
        })
        .expect(201);
    }
  });

  afterAll(async () => {
    await prisma.securityEvent.deleteMany({
      where: { user: { email: { startsWith: prefix } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { email: { startsWith: prefix } } },
    });
    await prisma.workspaceMember.deleteMany({
      where: { workspace: { owner: { email: { startsWith: prefix } } } },
    });
    await prisma.workspace.deleteMany({
      where: { owner: { email: { startsWith: prefix } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: prefix } },
    });
    await app.close();
  });

  it('blocks with 429 too_many_attempts after 10 failures in 15 minutes', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await login(emailA, 'WrongPass999!').expect(401);
    }

    const blocked = await login(emailA, password).expect(429);
    expect(blocked.body.code).toBe('too_many_attempts');

    const failures = await prisma.securityEvent.count({
      where: {
        user: { email: emailA },
        type: 'failed_login',
        revoked: false,
      },
    });
    expect(failures).toBe(10);
  });

  it('resets the failure counter after a successful login', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(emailB, 'WrongPass999!').expect(401);
    }
    await login(emailB, password).expect(200);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(emailB, 'WrongPass999!').expect(401);
    }
    // Without the reset this would be the 11th failure and return 429.
    await login(emailB, password).expect(200);
  });
});
