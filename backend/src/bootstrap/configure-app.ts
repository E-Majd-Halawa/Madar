import { RequestMethod, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter.js';
import { RequestIdInterceptor } from '../common/interceptors/request-id.interceptor.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

/**
 * Applies the cross-cutting HTTP setup in one place so `main.ts` and the e2e
 * tests exercise exactly the same behaviour (prefix, validation, errors, etc.).
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  const origins = new Set<string>();
  const configuredCors = config.get<string[]>('CORS_ORIGINS');
  if (Array.isArray(configuredCors)) {
    configuredCors.forEach((origin) => {
      if (origin) origins.add(origin);
    });
  }
  const frontendUrl = config.get<string>('FRONTEND_URL');
  if (frontendUrl) {
    frontendUrl
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }
  // Local development origins are always allowed.
  origins.add('http://localhost:5173');
  origins.add('http://localhost:3000');
  const corsOrigins = [...origins];

  app.use(helmet());
  app.enableCors({ origin: corsOrigins, credentials: true });

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());
}
