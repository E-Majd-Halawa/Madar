import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const taskStatusSchema = z.enum([
  'backlog',
  'todo',
  'in_progress',
  'review',
  'completed',
  'archived',
]);

const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
const recurrenceSchema = z.enum(['none', 'daily', 'weekly', 'monthly']);

const subtaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  done: z.boolean().optional(),
});

const commentSchema = z.object({
  id: z.string().optional(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string().optional(),
});

export const taskPatchSchema = z.object({
  projectId: z.string().nullable().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  category: z.string().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
  comments: z.array(commentSchema).optional(),
  estimateMinutes: z.number().int().nullable().optional(),
  trackedMinutes: z.number().int().optional(),
  recurrence: recurrenceSchema.optional(),
  completedAt: z.string().nullable().optional(),
});

export const createTaskSchema = z
  .object({
    workspaceId: z.string().min(1),
    title: z.string().min(1),
    creatorId: z.string().optional(),
  })
  .merge(taskPatchSchema);

export const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: taskStatusSchema,
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export const timeEntrySchema = z.object({
  minutes: z.number().int().positive().max(1440),
  note: z.string().optional(),
});

export class CreateTaskDto extends createZodDto(createTaskSchema) {}
export class UpdateTaskDto extends createZodDto(taskPatchSchema) {}
export class BulkStatusDto extends createZodDto(bulkStatusSchema) {}
export class BulkDeleteDto extends createZodDto(bulkDeleteSchema) {}
export class TimeEntryDto extends createZodDto(timeEntrySchema) {}
export class AddCommentDto extends createZodDto(
  z.object({ authorId: z.string(), content: z.string().min(1) }),
) {}
