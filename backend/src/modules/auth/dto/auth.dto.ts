import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address');
const passwordSchema = z.string().min(1, 'Password is required');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean().optional(),
});

export class LoginDto extends createZodDto(loginSchema) {}

/**
 * Mirrors frontend/src/schemas/auth.ts: 8+ characters and at least 3 of the
 * 4 rules (length, uppercase, number, symbol).
 */
export const strongPasswordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine((value) => {
    const satisfied = [
      value.length >= 8,
      /[A-Z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length;
    return satisfied >= 3 && value.length >= 8;
  }, 'Password must be at least 8 characters and satisfy 3 of: uppercase, number, symbol');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid username characters'),
  email: emailSchema,
  password: strongPasswordSchema,
});

export class RegisterDto extends createZodDto(registerSchema) {}

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class RefreshDto extends createZodDto(refreshSchema) {}

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export class LogoutDto extends createZodDto(logoutSchema) {}

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
