import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const activityActionSchema = z.enum([
  'task_created',
  'task_updated',
  'task_completed',
  'project_created',
  'member_invited',
  'message_sent',
  'role_changed',
  'user_suspended',
  'settings_changed',
  'file_uploaded',
  'file_deleted',
  'comment_added',
]);
const activityTargetSchema = z.enum([
  'task',
  'project',
  'member',
  'channel',
  'workspace',
  'file',
  'comment',
]);

export const createActivitySchema = z.object({
  action: activityActionSchema,
  targetType: activityTargetSchema,
  targetName: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export class CreateActivityDto extends createZodDto(createActivitySchema) {}

export const focusSessionSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1).optional(),
  taskId: z.string().nullable().optional(),
  startedAt: z.string(),
  minutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60),
});
export class FocusSessionDto extends createZodDto(focusSessionSchema) {}
