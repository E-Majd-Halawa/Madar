import type { PrismaService } from '../../database/prisma.service.js';
import { DEMO_USER_EMAIL, LockoutService } from './lockout.service.js';

function createPrismaMock() {
  return {
    securityEvent: {
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };
}

describe('LockoutService', () => {
  it('never locks out the demo user', async () => {
    const prisma = createPrismaMock();
    const service = new LockoutService(prisma as unknown as PrismaService);

    prisma.securityEvent.count.mockResolvedValue(999);
    await expect(
      service.isLockedOut(DEMO_USER_EMAIL, '127.0.0.1'),
    ).resolves.toBe(false);
    expect(prisma.securityEvent.count).not.toHaveBeenCalled();
  });

  it('locks out on the 10th recorded failure', async () => {
    const prisma = createPrismaMock();
    const service = new LockoutService(prisma as unknown as PrismaService);

    prisma.securityEvent.count.mockResolvedValue(9);
    await expect(
      service.isLockedOut('test_lock@example.com', 'ip'),
    ).resolves.toBe(false);

    prisma.securityEvent.count.mockResolvedValue(10);
    await expect(
      service.isLockedOut('test_lock@example.com', 'ip'),
    ).resolves.toBe(true);
  });

  it('normalizes the email when recording a failure', async () => {
    const prisma = createPrismaMock();
    const service = new LockoutService(prisma as unknown as PrismaService);
    prisma.securityEvent.create.mockResolvedValue({});

    await service.recordFailure(
      '  Test_Lock@Example.com ',
      'ip',
      'agent',
      'u-1',
    );

    expect(prisma.securityEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'failed_login',
        descriptionParams: { email: 'test_lock@example.com' },
        ip: 'ip',
        device: 'agent',
        revoked: false,
        userId: 'u-1',
      }),
    });
  });

  it('resets only the matching email+IP failures', async () => {
    const prisma = createPrismaMock();
    const service = new LockoutService(prisma as unknown as PrismaService);
    prisma.securityEvent.updateMany.mockResolvedValue({ count: 3 });

    await service.reset(' Test_Lock@Example.com ', 'ip');

    expect(prisma.securityEvent.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        type: 'failed_login',
        ip: 'ip',
        revoked: false,
        descriptionParams: {
          path: ['email'],
          equals: 'test_lock@example.com',
        },
      }),
      data: { revoked: true },
    });
  });
});
