import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

export const DEMO_USER_EMAIL = 'demo@taskflow3d.com';

@Injectable()
export class LockoutService {
  /** 10 failures inside 15 minutes block the email+IP pair. */
  static readonly MAX_FAILURES = 10;
  static readonly WINDOW_MS = 15 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  /** The demo account is never locked out. */
  async isLockedOut(email: string, ip: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === DEMO_USER_EMAIL) {
      return false;
    }

    const windowStart = new Date(Date.now() - LockoutService.WINDOW_MS);
    const failures = await this.prisma.securityEvent.count({
      where: {
        type: 'failed_login',
        ip,
        revoked: false,
        createdAt: { gte: windowStart },
        descriptionParams: {
          path: ['email'],
          equals: normalizedEmail,
        },
      },
    });

    return failures >= LockoutService.MAX_FAILURES;
  }

  /** Every failed attempt is recorded, whether or not the email exists. */
  async recordFailure(
    email: string,
    ip: string,
    userAgent: string | undefined,
    userId?: string,
  ): Promise<void> {
    await this.prisma.securityEvent.create({
      data: {
        type: 'failed_login',
        descriptionKey: 'security.failed_login',
        descriptionParams: { email: email.trim().toLowerCase() },
        ip,
        device: userAgent,
        revoked: false,
        ...(userId ? { userId } : {}),
      },
    });
  }

  /** A successful login clears the counter for this email+IP. */
  async reset(email: string, ip: string): Promise<void> {
    await this.prisma.securityEvent.updateMany({
      where: {
        type: 'failed_login',
        ip,
        revoked: false,
        descriptionParams: {
          path: ['email'],
          equals: email.trim().toLowerCase(),
        },
      },
      data: { revoked: true },
    });
  }
}
