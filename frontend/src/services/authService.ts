import type { AuthService } from '@/api/contracts';
import { mockAuthService } from '@/api/mock/mockAuthService';
import { httpAuthService } from '@/api/adapters/http/httpAuthService';

export const authService: AuthService = import.meta.env.VITE_API_URL ? httpAuthService : mockAuthService;
