/**
 * The only place that touches browser storage directly.
 * Mock services and Zustand persistence go through here, never the UI.
 * Swap for IndexedDB (phase 9) without touching callers.
 */
export interface KeyValueStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

const PREFIX = 'tf3d:';
const memory = new Map<string, string>();

class SafeLocalStorage implements KeyValueStorage {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(PREFIX + key) ?? memory.get(PREFIX + key) ?? null;
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    try {
      window.localStorage.setItem(PREFIX + key, raw);
    } catch {
      memory.set(PREFIX + key, raw);
    }
  }

  remove(key: string): void {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* storage unavailable */
    }
    memory.delete(PREFIX + key);
  }
}

export const storage: KeyValueStorage = new SafeLocalStorage();
