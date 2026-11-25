import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

export const workspaceTypeSchema = z.enum(['personal', 'team']);
export const workspaceRoleSchema = z.enum(['owner', 'admin', 'member', 'guest']);
export const memberRoleSchema = z.enum(['admin', 'member', 'guest']);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  description: z.string().trim().max(500).optional().default(''),
  type: workspaceTypeSchema.default('team'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color')
    .default('#10b981'),
  initialMembers: z.array(z.string().trim().min(1)).optional().default([]),
});

export class CreateWorkspaceDto extends createZodDto(createWorkspaceSchema) {}

export const addMemberSchema = z.object({
  username: z.string().trim().min(1, 'Username is required').max(40),
  role: memberRoleSchema.default('member'),
  department: z.string().trim().max(100).optional().default('General'),
});

export class AddMemberDto extends createZodDto(addMemberSchema) {}

export const updateMemberSchema = z.object({
  role: memberRoleSchema.optional(),
  department: z.string().trim().max(100).optional(),
});

export class UpdateMemberDto extends createZodDto(updateMemberSchema) {}

export const candidateUsersQuerySchema = z.object({
  q: z.string().trim().max(80).default(''),
});

export class CandidateUsersQueryDto extends createZodDto(
  candidateUsersQuerySchema,
) {}

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type CandidateUsersQuery = z.infer<typeof candidateUsersQuerySchema>;