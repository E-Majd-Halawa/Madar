import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const csv = z
  .string()
  .default('http://localhost:5173')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

/** Accepts true/false, 1/0, yes/no, on/off (dotenv gives us strings). */
const booleanValue = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'must be at least 32 characters')
    .optional(),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: csv,
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(25),
  ENABLE_DEMO_LOGIN: booleanValue.optional(),
  THROTTLE_ENABLED: booleanValue.optional(),
  THROTTLE_STRICT_LIMIT: z.coerce.number().int().positive().default(10),
  THROTTLE_WRITE_LIMIT: z.coerce.number().int().positive().default(60),
  THROTTLE_READ_LIMIT: z.coerce.number().int().positive().default(300),
  PUBLIC_WEB_URL: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === 'production' && !env.JWT_ACCESS_SECRET) {
    throw new Error(
      'Invalid environment configuration:\n  - JWT_ACCESS_SECRET: required in production',
    );
  }
  if (!env.JWT_ACCESS_SECRET) {
    env.JWT_ACCESS_SECRET = randomBytes(48).toString('hex');
  }
  env.ENABLE_DEMO_LOGIN ??= env.NODE_ENV !== 'production';
  env.THROTTLE_ENABLED ??= true;
  return { ...config, ...env };
}
