import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RecentSearch, SearchCategory, SearchResults } from '@/api/contracts/search';
import { searchService } from '@/services/searchService';
import { safeStateStorage } from '@/services/storage/persistStorage';

interface SearchState {
  query: string;
  category: SearchCategory;
  results: SearchResults | null;
  loading: boolean;
  recentSearches: RecentSearch[];

  setQuery: (query: string) => void;
  setCategory: (category: SearchCategory) => void;
  search: (query: string, workspaceId: string, userId: string, category?: SearchCategory) => Promise<void>;
  loadRecent: (userId: string) => Promise<void>;
  saveRecent: (userId: string, query: string) => Promise<void>;
  clearRecent: (userId: string) => Promise<void>;
  reset: () => void;
}

/** Debounce ref stored outside Zustand to avoid serialisation issues. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: '',
      category: 'all',
      results: null,
      loading: false,
      recentSearches: [],

      setQuery: (query) => set({ query }),
      setCategory: (category) => set({ category }),

      search: async (query, workspaceId, userId, category) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        const effectiveCategory = category ?? get().category;

        if (!query.trim()) {
          set({ results: null, loading: false });
          return;
        }

        set({ loading: true });
        debounceTimer = setTimeout(async () => {
          try {
            const results = await searchService.search(query, {
              workspaceId,
              userId,
              category: effectiveCategory,
              limit: 40,
            });
            set({ results, loading: false });
          } catch {
            set({ loading: false });
          }
        }, 200);
      },

      loadRecent: async (userId) => {
        const recentSearches = await searchService.getRecentSearches(userId);
        set({ recentSearches });
      },

      saveRecent: async (userId, query) => {
        await searchService.saveRecentSearch(userId, query);
        const recentSearches = await searchService.getRecentSearches(userId);
        set({ recentSearches });
      },

      clearRecent: async (userId) => {
        await searchService.clearRecentSearches(userId);
        set({ recentSearches: [] });
      },

      reset: () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        set({ query: '', results: null, loading: false });
      },
    }),
    {
      name: 'tf3d.search',
      version: 1,
      storage: createJSONStorage(() => safeStateStorage),
      partialize: (s) => ({ recentSearches: s.recentSearches }),
    },
  ),
);
