import type { FocusService } from '@/api/contracts/focus';
import { mockFocusService } from '@/api/mock/mockFocusService';
import { useMocks } from '@/services/serviceMode';
import { unimplementedService } from '@/services/unimplementedService';

// Swap point: replace mockFocusService with a REST API adapter when VITE_API_URL is configured.
export const focusService: FocusService = useMocks() ? mockFocusService : unimplementedService<FocusService>('focusService');
