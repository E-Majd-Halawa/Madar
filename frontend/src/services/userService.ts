import type { UserService } from '@/api/contracts';
import { mockUserService } from '@/api/mock/mockUserService';
import { httpUserService } from '@/api/adapters/http/httpUserService';

export const userService: UserService = import.meta.env.VITE_API_URL ? httpUserService : mockUserService;
