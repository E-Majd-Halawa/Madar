/**
 * Placeholder for feature services that have no HTTP adapter yet. Calling any
 * method throws instead of silently returning mock data.
 */
export function unimplementedService<T = any>(name: string): T {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop === 'symbol') return undefined;
      return (..._args: unknown[]) => {
        throw new Error(
          `${name}.${String(prop)} is not implemented for the HTTP backend.`,
        );
      };
    },
  };
  return new Proxy({}, handler) as T;
}