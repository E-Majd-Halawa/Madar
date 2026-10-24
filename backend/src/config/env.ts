import { randomBytes } from 'node:crypto';
import { z } from 'zod';

/** Comma-separated list -> trimmed string array. */
const csv = z
  .string()
  .default('http://localhost:5173')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Optional in development so a fresh checkout can boot; required in production.
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'must be at least 32 characters')
    .optional(),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: csv,
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(25),
  ENABLE_DEMO_LOGIN: z.preprocess(
    (val) => (val === undefined ? process.env.NODE_ENV !== 'production' : val),
    z.coerce.boolean(),
  ),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validation hook for `ConfigModule.forRoot({ validate })`.
 * Fails fast with a readable message and never prints secret values.
 */
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

  // Development-only ephemeral secret: no secret is hard-coded, but tokens are
  // invalidated on every restart until the owner sets JWT_ACCESS_SECRET.
  if (!env.JWT_ACCESS_SECRET) {
    env.JWT_ACCESS_SECRET = randomBytes(48).toString('hex');
  }

  return { ...config, ...env };
}
