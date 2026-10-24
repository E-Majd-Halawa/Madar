import type { FocusService } from '@/api/contracts/focus';
import { mockFocusService } from '@/api/mock/mockFocusService';

// Swap point: replace mockFocusService with a REST API adapter when VITE_API_URL is configured.
export const focusService: FocusService = mockFocusService;
