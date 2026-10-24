import type { SearchService } from '@/api/contracts/search';
import { mockSearchService } from '@/api/mock/mockSearchService';

// Swap point: replace mockSearchService with a REST/Algolia/ElasticSearch adapter
// when VITE_SEARCH_URL is configured. The adapter must implement SearchService exactly.
export const searchService: SearchService = mockSearchService;
