vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'true';
  process.env.THROTTLE_STRICT_LIMIT = '3';
});

/**
 * Rate limiting E2E test. Runs in its own app instance with low limits.
 * Uses /auth/password/forgot with a nonexistent test_rl_ email so no rows are
 * created and no seeded user is touched.
 */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';

const uniqueSuffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const email = `test_rl_${uniqueSuffix}@example.com`;

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 too_many_requests after the strict limit', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/forgot')
        .send({ email })
        .expect(204);
    }

    const limited = await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email })
      .expect(429);

    expect(limited.body.code).toBe('too_many_requests');
    expect(limited.body).toHaveProperty('requestId');
  });

  it('never rate limits /health', async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await request(app.getHttpServer()).get('/health').expect(200);
    }
  });
});
