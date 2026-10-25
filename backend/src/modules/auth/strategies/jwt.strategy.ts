import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { User } from '../../../common/contracts/api.contracts.js';
import { PrismaService } from '../../../database/prisma.service.js';

export interface JwtPayload {
  sub: string;
  role: string;
  sid: string;
}

export interface AuthenticatedUser extends User {
  /** Refresh-token family id carried by the access token. */
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'session_expired',
        message: 'Session expired.',
      });
    }
    if (user.status === 'suspended') {
      throw new UnauthorizedException({
        code: 'account_suspended',
        message: 'This account is suspended.',
      });
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt.toISOString(),
      sid: payload.sid,
    };
  }
}
