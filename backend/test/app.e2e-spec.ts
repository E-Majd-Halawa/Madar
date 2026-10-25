import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/bootstrap/configure-app.js';

describe('Madar API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('GET /health reports liveness', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok' });
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('GET /health/ready reports the database', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);

    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('returns the error envelope for an unknown route', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .expect(404);

    expect(response.body).toMatchObject({
      code: 'not_found',
      requestId: expect.any(String),
    });
    expect(typeof response.body.message).toBe('string');
  });

  it('keeps health outside the /api/v1 prefix', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
