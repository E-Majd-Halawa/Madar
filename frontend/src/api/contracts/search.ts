/** Search result category. */
export type SearchCategory = 'all' | 'tasks' | 'projects' | 'people' | 'messages' | 'files' | 'events';

/** A single highlighted range: [start, end) character offsets in the original text. */
export interface HighlightRange {
  start: number;
  end: number;
}

export interface SearchResultBase {
  id: string;
  category: Exclude<SearchCategory, 'all'>;
  title: string;
  subtitle?: string;
  /** ISO timestamp for recency boosting; also shown in UI. */
  updatedAt: string;
  /** Highlight ranges in `title`. */
  titleRanges: HighlightRange[];
  /** Highlight ranges in `subtitle`. */
  subtitleRanges: HighlightRange[];
  /** Relevance score (higher = better). */
  score: number;
  /** Extra metadata per category. */
  meta: Record<string, string>;
}

export interface SearchResults {
  query: string;
  items: SearchResultBase[];
  counts: Record<Exclude<SearchCategory, 'all'>, number>;
  /** The items are a page; more may be fetched. Future: server-side pagination. */
  hasMore: boolean;
}

export interface SearchOptions {
  workspaceId: string;
  userId: string;
  category?: SearchCategory;
  /** Max results to return (default 40). Future: server-side limit. */
  limit?: number;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
}

export interface SearchService {
  /** GET /search?q=&workspaceId=&category=&limit= */
  search(query: string, options: SearchOptions): Promise<SearchResults>;
  /** GET /search/recent?userId= */
  getRecentSearches(userId: string): Promise<RecentSearch[]>;
  /** POST /search/recent */
  saveRecentSearch(userId: string, query: string): Promise<void>;
  /** DELETE /search/recent */
  clearRecentSearches(userId: string): Promise<void>;
}
