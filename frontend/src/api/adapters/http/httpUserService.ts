import type { UserService, UserListQuery } from '@/api/contracts';
import type { Paged, User } from '@/types';
import { http } from './httpClient';

/** Keeps query params inside the backend's validation range (1..100). */
function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export const httpUserService: UserService = {
  async list(query?: UserListQuery): Promise<Paged<User>> {
    const params = new URLSearchParams();
    if (query?.query) params.set('query', query.query);
    if (query?.role) params.set('role', query.role);
    if (query?.page) params.set('page', String(clampInt(query.page, 1, Number.MAX_SAFE_INTEGER)));
    if (query?.pageSize) params.set('pageSize', String(clampInt(query.pageSize, 1, 100)));
    const qs = params.toString();
    const url = qs ? `/users?${qs}` : '/users';
    return http<Paged<User>>(url);
  },
  async getById(id: string): Promise<User | null> {
    try {
      return await http<User>(`/users/${id}`);
    } catch (err: any) {
      if (err?.status === 404) return null;
      throw err;
    }
  },
};
