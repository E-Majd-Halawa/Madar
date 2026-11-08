import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const fileTypeSchema = z.enum([
  'document',
  'design',
  'image',
  'archive',
  'code',
  'other',
]);

export const presignFileSchema = z.object({
  name: z.string().min(1),
  size: z.coerce.number().int().positive(),
  type: fileTypeSchema,
  mime: z.string().min(1),
  projectId: z.string().nullable().optional(),
  folder: z.string().default('General'),
  description: z.string().optional(),
});

export const confirmFileSchema = z.object({
  storageKey: z.string().min(1),
  name: z.string().min(1),
  size: z.coerce.number().int().positive(),
  type: fileTypeSchema,
  mime: z.string().min(1),
  projectId: z.string().nullable().optional(),
  folder: z.string().default('General'),
  description: z.string().optional(),
  checksum: z.string().optional(),
});

export class PresignFileDto extends createZodDto(presignFileSchema) {}
export class ConfirmFileDto extends createZodDto(confirmFileSchema) {}

export type PresignFileData = z.infer<typeof presignFileSchema>;
export type ConfirmFileData = z.infer<typeof confirmFileSchema>;
