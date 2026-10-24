/**
 * Foundation for future REST adapters (NestJS / Express).
 * Attaches the JWT and retries once after a refresh on 401.
 * Not used while running on mock services.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
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

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = (token: string | null) => {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${BASE_URL}${path}`, { ...init, headers });
  };

  let response = await send(tokenProvider?.getAccessToken() ?? null);
  if (response.status === 401 && tokenProvider) {
    const token = await tokenProvider.refresh();
    if (token) response = await send(token);
  }
  if (!response.ok) throw new HttpError(response.status, response.statusText);
  return (response.status === 204 ? undefined : await response.json()) as T;
}
