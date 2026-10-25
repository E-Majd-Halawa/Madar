import { randomUUID } from 'node:crypto';
import { Module, type ExecutionContext } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  type ThrottlerModuleOptions,
  type ThrottlerOptions,
} from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { PermissionsGuard } from './common/permissions/permissions.guard.js';
import {
  RATE_LIMIT_KEY,
  type RateLimitKind,
} from './common/rate-limit/rate-limit.decorator.js';
import { validateEnv } from './config/env.js';
import { PrismaModule } from './database/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDevelopment = config.get<string>('NODE_ENV') !== 'production';

        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info',
            base: undefined,
            // Request logs contain only: method, url, statusCode,
            // responseTime and requestId. Headers and bodies are never logged.
            serializers: {
              req: (req: IncomingMessage) => ({
                method: req.method,
                url: req.url,
              }),
              res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
            },
            customProps: (req: IncomingMessage) => ({
              requestId: (req as IncomingMessage & { id?: string }).id,
            }),
            // Defense in depth, in case a serializer is ever extended.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
            genReqId: (req: IncomingMessage, res: ServerResponse) => {
              const header = req.headers['x-request-id'];
              const id =
                (typeof header === 'string' && header.length > 0
                  ? header
                  : undefined) ?? randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, Reflector],
      useFactory: (
        config: ConfigService,
        reflector: Reflector,
      ): ThrottlerModuleOptions => {
        const enabled = config.get<boolean>('THROTTLE_ENABLED') ?? true;
        const strictLimit = config.get<number>('THROTTLE_STRICT_LIMIT') ?? 10;
        const writeLimit = config.get<number>('THROTTLE_WRITE_LIMIT') ?? 60;
        const readLimit = config.get<number>('THROTTLE_READ_LIMIT') ?? 300;

        const resolveKind = (
          context: ExecutionContext,
        ): RateLimitKind | 'skip' => {
          const request = context.switchToHttp().getRequest<{
            method?: string;
            originalUrl?: string;
            url?: string;
          }>();
          const path = (request.originalUrl ?? request.url ?? '').split('?')[0];

          // /health must never be rate limited.
          if (path === '/health' || path.startsWith('/health/')) {
            return 'skip';
          }
          // Swagger UI loads many static assets; do not throttle docs.
          if (path === '/api/docs' || path.startsWith('/api/docs/')) {
            return 'skip';
          }

          const declared = reflector.getAllAndOverride<RateLimitKind>(
            RATE_LIMIT_KEY,
            [context.getHandler(), context.getClass()],
          );
          if (declared) return declared;

          const method = request.method ?? 'GET';
          return ['GET', 'HEAD', 'OPTIONS'].includes(method) ? 'read' : 'write';
        };

        const throttler = (
          name: RateLimitKind,
          limit: number,
        ): ThrottlerOptions => ({
          name,
          limit,
          ttl: 60_000,
          skipIf: (context) => !enabled || resolveKind(context) !== name,
        });

        return {
          throttlers: [
            throttler('strict', strictLimit),
            throttler('write', writeLimit),
            throttler('read', readLimit),
          ],
          errorMessage: 'Too many requests. Please try again later.',
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    // Order matters: authentication -> authorization -> rate limiting.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
