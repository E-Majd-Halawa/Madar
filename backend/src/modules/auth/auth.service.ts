import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import type {
  LoginInput,
  RegisterInput,
} from '../../../../frontend/src/api/contracts/auth.ts';
import type { AuthSession, AuthTokens, User } from '../../../../frontend/src/types/index.ts';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private formatUser(user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    status: string;
    avatarUrl: string | null;
    createdAt: Date;
    lastActiveAt: Date;
  }): User {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role as User['role'],
      status: user.status as User['status'],
      avatarUrl: user.avatarUrl ?? undefined,
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt.toISOString(),
    };
  }

  private parseTtlMs(ttlStr: string): number {
    const match = ttlStr.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000;
    const val = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return val * 1000;
      case 'm':
        return val * 60 * 1000;
      case 'h':
        return val * 60 * 60 * 1000;
      case 'd':
        return val * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000;
    }
  }

  private async issueTokens(
    userId: string,
    role: string,
    familyId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens & { rawRefreshToken: string }> {
    const accessTtl = this.configService.get<string>('JWT_ACCESS_TTL') || '15m';
    const accessTtlMs = this.parseTtlMs(accessTtl);
    const expiresAt = Date.now() + accessTtlMs;

    const accessToken = this.jwtService.sign(
      { sub: userId, role, sid: familyId },
      { expiresIn: accessTtl as any },
    );

    const refreshTtlDays =
      this.configService.get<number>('REFRESH_TTL_DAYS') || 30;
    const refreshExpiresAt = new Date(
      Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    const rawRefreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt: refreshExpiresAt,
        ip,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      rawRefreshToken,
      expiresAt,
    };
  }

  async login(
    input: LoginInput & { remember?: boolean },
    ip?: string,
    userAgent?: string,
  ): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const genericError = new UnauthorizedException({
      code: 'invalid_credentials',
      message: 'Invalid email or password.',
    });

    if (!user) {
      await this.prisma.securityEvent.create({
        data: {
          type: 'failed_login',
          descriptionKey: 'security.failed_login',
          descriptionParams: { email },
          ip,
          device: userAgent,
        },
      });
      throw genericError;
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      await this.prisma.securityEvent.create({
        data: {
          type: 'failed_login',
          descriptionKey: 'security.failed_login',
          userId: user.id,
          ip,
          device: userAgent,
        },
      });
      throw genericError;
    }

    if (user.status === 'suspended') {
      throw new ForbiddenException({
        code: 'account_suspended',
        message: 'This account is suspended.',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const familyId = randomUUID();
    const tokens = await this.issueTokens(
      user.id,
      user.role,
      familyId,
      ip,
      userAgent,
    );

    await this.prisma.securityEvent.create({
      data: {
        type: 'session',
        descriptionKey: 'security.new_session',
        userId: user.id,
        ip,
        device: userAgent,
      },
    });

    return {
      user: this.formatUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
      isDemo: false,
    };
  }

  async register(
    input: RegisterInput,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthSession> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException({
        code: 'email_taken',
        message: 'Email is already registered.',
      });
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException({
        code: 'username_taken',
        message: 'Username is taken.',
      });
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });
    const userId = `u-${Date.now().toString(36)}`;
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        fullName: input.fullName.trim(),
        username,
        email,
        role: 'user', // Forced role
        status: 'active', // Forced status
        passwordHash,
        createdAt: now,
        lastActiveAt: now,
      },
    });

    // Create personal workspace as in mockWorkspaceService.ts
    const workspaceId = `ws-personal-${userId}`;
    await this.prisma.workspace.create({
      data: {
        id: workspaceId,
        name: 'Personal Workspace',
        description: 'Your private space for personal tasks and goals.',
        type: 'personal',
        ownerId: userId,
        color: '#10b981',
        createdAt: now,
      },
    });

    await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: 'owner',
        status: 'active',
        joinedAt: now,
      },
    });

    const familyId = randomUUID();
    const tokens = await this.issueTokens(
      userId,
      user.role,
      familyId,
      ip,
      userAgent,
    );

    await this.prisma.securityEvent.create({
      data: {
        type: 'session',
        descriptionKey: 'security.new_session',
        userId,
        ip,
        device: userAgent,
      },
    });

    return {
      user: this.formatUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
      isDemo: false,
    };
  }

  async loginAsDemo(ip?: string, userAgent?: string): Promise<AuthSession> {
    const demoLoginEnabled =
      this.configService.get<boolean>('ENABLE_DEMO_LOGIN') ?? true;
    if (!demoLoginEnabled) {
      throw new ForbiddenException({
        code: 'invalid_credentials',
        message: 'Demo login is disabled.',
      });
    }

    const demoUser = await this.prisma.user.findUnique({
      where: { id: 'u-001' },
    });
    if (!demoUser) {
      throw new UnauthorizedException({
        code: 'invalid_credentials',
        message: 'Demo user is unavailable.',
      });
    }

    const familyId = randomUUID();
    const tokens = await this.issueTokens(
      demoUser.id,
      demoUser.role,
      familyId,
      ip,
      userAgent,
    );

    return {
      user: this.formatUser(demoUser),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
      isDemo: true,
    };
  }

  async refresh(
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const expiredError = new UnauthorizedException({
      code: 'session_expired',
      message: 'Session expired.',
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw expiredError;
    }

    // Reuse detection
    if (storedToken.revokedAt !== null) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await this.prisma.securityEvent.create({
        data: {
          type: 'suspicious',
          descriptionKey: 'security.refresh_reuse',
          descriptionParams: { familyId: storedToken.familyId },
          userId: storedToken.userId,
          ip,
          device: userAgent,
        },
      });

      throw expiredError;
    }

    const user = storedToken.user;
    if (user.status === 'suspended') {
      throw new ForbiddenException({
        code: 'account_suspended',
        message: 'This account is suspended.',
      });
    }

    // Rotation: create new token in the same family, mark old token as revoked
    const accessTtl = this.configService.get<string>('JWT_ACCESS_TTL') || '15m';
    const accessTtlMs = this.parseTtlMs(accessTtl);
    const expiresAt = Date.now() + accessTtlMs;

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role, sid: storedToken.familyId },
      { expiresIn: accessTtl as any },
    );

    const refreshTtlDays =
      this.configService.get<number>('REFRESH_TTL_DAYS') || 30;
    const refreshExpiresAt = new Date(
      Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    const newRawToken = randomBytes(32).toString('hex');
    const newTokenHash = createHash('sha256')
      .update(newRawToken)
      .digest('hex');

    const newTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: storedToken.familyId,
        expiresAt: refreshExpiresAt,
        ip,
        userAgent,
      },
    });

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedById: newTokenRecord.id,
      },
    });

    return {
      accessToken,
      refreshToken: newRawToken,
      expiresAt,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (user) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
      const webUrl =
        this.configService.get<string>('PUBLIC_WEB_URL') ||
        'http://localhost:5173';
      const resetLink = `${webUrl}/reset-password?token=${rawToken}`;

      if (isDev) {
        this.logger.log(`Password reset link for ${trimmedEmail}: ${resetLink}`);
      } else {
        this.logger.log(
          `Password reset token requested for user ID: ${user.id}`,
        );
      }
    }
  }
}
