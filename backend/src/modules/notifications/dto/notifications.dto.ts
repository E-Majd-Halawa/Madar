import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const typeSchema = z.enum([
  'task_assigned',
  'task_completed',
  'deadline',
  'mention',
  'message',
  'project_update',
  'invitation',
  'role_change',
  'security',
  'system',
]);

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: typeSchema,
  title: z.string().min(1),
  body: z.string().optional(),
  href: z.string().optional(),
});
export const markReadSchema = z.object({ read: z.boolean() });

export class CreateNotificationDto extends createZodDto(
  createNotificationSchema,
) {}
export class MarkReadDto extends createZodDto(markReadSchema) {}
