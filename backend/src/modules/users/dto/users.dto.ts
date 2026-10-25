import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';
import { ROLE_ORDER } from '../../../common/permissions/permissions.js';

/** frontend/src/api/contracts/users.ts:3-8 */
export const listUsersQuerySchema = z.object({
  query: z.string().trim().default(''),
  role: z.enum(ROLE_ORDER).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
