import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paged, User } from '../../common/contracts/api.contracts.js';
import { toUserDto } from '../../common/mappers/user.mapper.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { ListUsersQuery } from './dto/users.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Same search/filter/pagination behaviour as mockUserService.ts. */
  async list({
    query,
    role,
    page,
    pageSize,
  }: ListUsersQuery): Promise<Paged<User>> {
    const needle = query.trim();

    const where = {
      ...(role ? { role } : {}),
      ...(needle
        ? {
            OR: [
              { fullName: { contains: needle, mode: 'insensitive' as const } },
              { username: { contains: needle, mode: 'insensitive' as const } },
              { email: { contains: needle, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map(toUserDto),
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'User not found.',
      });
    }

    return toUserDto(user);
  }
}
