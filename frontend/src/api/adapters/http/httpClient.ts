/**
 * Foundation for REST adapters (NestJS / Express).
 * Attaches the JWT and retries once after a refresh on 401.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export interface FieldError {
  field: string;
  message: string;
}

export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: FieldError[];

  constructor(status: number, message: string, code?: string, fieldErrors?: FieldError[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface TokenProvider {
  getAccessToken(): string | null;
  /** Returns a fresh access token, or null when the session can't be renewed. */
  refresh(): Promise<string | null>;
}

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

// Deduplicates concurrent refresh attempts so multiple parallel 401s share a
// single refresh request (and a single token rotation) instead of racing.
let refreshInFlight: Promise<string | null> | null = null;

function runRefresh(): Promise<string | null> {
  if (!tokenProvider) return Promise.resolve(null);
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      return await tokenProvider!.refresh();
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// Refresh requests must never go through the auto-refresh retry loop, otherwise
// a failed refresh triggers another refresh (infinite recursion).
function isRefreshRequest(path: string): boolean {
  return path === '/auth/refresh' || path.startsWith('/auth/refresh?') || path.startsWith('/auth/refresh/');
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${BASE_URL}${path}`, { ...init, headers });
  };

  let response = await send(tokenProvider?.getAccessToken() ?? null);
  if (response.status === 401 && tokenProvider && !isRefreshRequest(path)) {
    const token = await runRefresh();
    if (token) response = await send(token);
  }

  if (!response.ok) {
    let errorData: any = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore non-json response
    }
    const message = errorData?.message || response.statusText;
    const code = errorData?.code;
    const fieldErrors = errorData?.fieldErrors;
    throw new HttpError(response.status, message, code, fieldErrors);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}
