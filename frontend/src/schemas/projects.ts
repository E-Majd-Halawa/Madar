import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().trim().min(2, 'validation.titleShort').max(80, 'validation.titleLong'),
  description: z.string().trim().max(500, 'validation.titleLong').optional().or(z.literal('')),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']),
  color: z.string().min(1, 'validation.required'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

export type ProjectForm = z.infer<typeof projectSchema>;
