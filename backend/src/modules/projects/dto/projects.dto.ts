import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const projectStatusSchema = z.enum([
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
]);

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  status: projectStatusSchema.optional(),
  color: z.string().min(1),
  ownerId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  startDate: z.string(),
  dueDate: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: projectStatusSchema.optional(),
  color: z.string().optional(),
  ownerId: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
});

export class CreateProjectDto extends createZodDto(createProjectSchema) {}
export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}
export class CreateProjectInput extends createZodDto(createProjectSchema) {}
export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
