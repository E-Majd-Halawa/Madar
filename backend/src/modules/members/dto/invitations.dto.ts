import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

/**
 * `owner` is accepted by the schema so the service can return the stable
 * `invalid_role` code instead of a generic validation error.
 */
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform((value) => value.toLowerCase()),
  role: z.enum(['owner', 'admin', 'member', 'guest']).default('member'),
  department: z.string().trim().max(120).optional(),
});

export class InviteMemberDto extends createZodDto(inviteMemberSchema) {}

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1, 'Invitation token is required'),
});

export class AcceptInvitationDto extends createZodDto(acceptInvitationSchema) {}

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
