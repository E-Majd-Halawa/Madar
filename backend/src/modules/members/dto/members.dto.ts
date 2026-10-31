import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

export const workspaceRoleSchema = z.enum([
  'owner',
  'admin',
  'member',
  'guest',
]);

export const updateMemberRoleSchema = z.object({
  role: workspaceRoleSchema,
});

export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema) {}

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
