import type { AuthService } from '@/api/contracts';
import { mockAuthService } from '@/api/mock/mockAuthService';

// Swap point: when VITE_API_URL is set, export a REST adapter built on
// '@/api/adapters/http/httpClient' instead. UI code never changes.
export const authService: AuthService = mockAuthService;
