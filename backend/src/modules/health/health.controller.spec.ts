import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { HealthController } from './health.controller.js';

function prismaMock(queryRaw: () => Promise<unknown>): PrismaService {
  return { $queryRaw: vi.fn(queryRaw) } as unknown as PrismaService;
}

describe('HealthController', () => {
  it('reports liveness', () => {
    const controller = new HealthController(
      prismaMock(async () => [{ '?column?': 1 }]),
    );

    const result = controller.live();

    expect(result.status).toBe('ok');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(typeof result.timestamp).toBe('string');
  });

  it('reports readiness when the database answers', async () => {
    const controller = new HealthController(
      prismaMock(async () => [{ '?column?': 1 }]),
    );

    await expect(controller.ready()).resolves.toMatchObject({
      status: 'ok',
      database: 'up',
    });
  });

  it('returns 503 when the database is unreachable', async () => {
    const controller = new HealthController(
      prismaMock(async () => {
        throw new Error('connection refused');
      }),
    );

    const error = await controller.ready().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getStatus()).toBe(503);
  });
});
