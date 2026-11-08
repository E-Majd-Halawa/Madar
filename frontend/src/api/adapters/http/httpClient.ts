/**
 * Foundation for REST adapters (NestJS / Express).
 * Attaches the JWT and retries once after a refresh on 401.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

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

  if (response.status === 204 || response.status === 205 || response.headers.get('Content-Length') === '0') {
    return undefined as T;
  }
  const text = await response.text();
  return (text.trim() === '' ? undefined : JSON.parse(text)) as T;
}
