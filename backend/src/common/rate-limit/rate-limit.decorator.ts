import { SetMetadata } from '@nestjs/common';

export type RateLimitKind = 'strict' | 'write' | 'read';

export const RATE_LIMIT_KEY = 'madar:rateLimitKind';

/**
 * Selects the throttling class for a route:
 *  - strict: 5-10/min (auth credential endpoints)
 *  - write:  60/min (mutations, default for non-GET)
 *  - read:   300/min (GET, default)
 *
 * `/health` is always exempt.
 */
export const RateLimit = (kind: RateLimitKind) =>
  SetMetadata(RATE_LIMIT_KEY, kind);
