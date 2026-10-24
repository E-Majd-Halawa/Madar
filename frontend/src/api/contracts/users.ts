import type { Paged, Role, User } from '@/types';

export interface UserListQuery {
  query?: string;
  role?: Role;
  page?: number;
  pageSize?: number;
}

/** GET /users?query=&role=&page=&pageSize=  ·  GET /users/:id */
export interface UserService {
  list(query?: UserListQuery): Promise<Paged<User>>;
  getById(id: string): Promise<User | null>;
}
