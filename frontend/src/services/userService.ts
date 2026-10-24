import type { UserService } from '@/api/contracts';
import { mockUserService } from '@/api/mock/mockUserService';

// Swap point: when VITE_API_URL is set, export a REST adapter built on
// '@/api/adapters/http/httpClient' instead. UI code never changes.
export const userService: UserService = mockUserService;
