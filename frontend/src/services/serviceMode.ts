/**
 * Mock services are only appropriate for local development or when explicitly
 * requested. In production with a configured API URL, feature services without a
 * real HTTP adapter must not silently return seed data.
 */
export function useMocks(): boolean {
  return (
    import.meta.env.DEV ||
    import.meta.env.VITE_USE_MOCKS === 'true' ||
    !import.meta.env.VITE_API_URL
  );
}