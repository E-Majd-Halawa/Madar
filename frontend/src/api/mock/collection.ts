import { storage } from '@/services/storage/storageAdapter';

/**
 * A persisted list backed by the storage adapter and seeded on first use.
 * Mock services use it as their "database table"; a REST adapter replaces it entirely.
 */
export function createCollection<T extends { id: string }>(key: string, seed: T[]) {
  const read = (): T[] => storage.get<T[]>(key) ?? seed;
  const write = (items: T[]) => storage.set(key, items);
  return { read, write };
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
