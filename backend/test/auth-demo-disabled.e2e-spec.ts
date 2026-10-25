vi.hoisted(() => {
  process.env.THROTTLE_ENABLED = 'false';
  process.env.ENABLE_DEMO_LOGIN = 'false';
});

/** Demo login must be disabled when ENABLE_DEMO_LOGIN=false. */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';

describe('Demo login disabled (e2e)', () => {
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

  it('POST /auth/demo returns 403 when the flag is false', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/demo')
      .expect(403);
    expect(res.body).toHaveProperty('code');
    expect(res.body).not.toHaveProperty('tokens');
  });
});
