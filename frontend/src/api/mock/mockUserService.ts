import type { UserService } from '@/api/contracts';
import { delay } from './delay';
import { getAllUsers } from './userRegistry';

export const mockUserService: UserService = {
  async list({ query = '', role, page = 1, pageSize = 10 } = {}) {
    await delay();
    const needle = query.trim().toLowerCase();
    let items = getAllUsers();
    if (role) items = items.filter((u) => u.role === role);
    if (needle) {
      items = items.filter((u) =>
        [u.fullName, u.username, u.email].some((field) => field.toLowerCase().includes(needle)),
      );
    }
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  },

  async getById(id) {
    await delay(150);
    return getAllUsers().find((u) => u.id === id) ?? null;
  },
};
