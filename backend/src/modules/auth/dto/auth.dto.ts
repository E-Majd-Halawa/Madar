import { z } from 'zod';
import { createZodDto } from '../../../common/pipes/zod-validation.pipe.js';

const emailSchema = z.string().trim().min(1, 'Email is required').email('Invalid email address');
const passwordSchema = z.string().min(1, 'Password is required');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  remember: z.boolean().optional(),
});

export class LoginDto extends createZodDto(loginSchema) {}

const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (v) =>
      /[A-Z]/.test(v) &&
      /\d/.test(v) &&
      /[^A-Za-z0-9]/.test(v),
    'Password must contain uppercase letter, number, and symbol',
  );

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
