import { z } from 'zod';

/** Messages are i18n keys; forms translate them with t(). */
const email = z.string().trim().min(1, 'validation.required').email('validation.email');

export const passwordRules = [
  { id: 'length', test: (v: string) => v.length >= 8 },
  { id: 'upper', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'number', test: (v: string) => /\d/.test(v) },
  { id: 'symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

/** 0-4: how many rules the password satisfies. */
export const passwordStrength = (value: string): number => passwordRules.filter((r) => r.test(value)).length;

const strongPassword = z
  .string()
  .min(1, 'validation.required')
  .refine((v) => passwordStrength(v) >= 3 && v.length >= 8, 'validation.passwordWeak');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'validation.required'),
  remember: z.boolean().optional(),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'validation.nameShort'),
    username: z
      .string()
      .trim()
      .min(3, 'validation.usernameShort')
      .regex(/^[a-zA-Z0-9._-]+$/, 'validation.usernameChars'),
    email,
    password: strongPassword,
    confirmPassword: z.string().min(1, 'validation.required'),
    terms: z.boolean().refine((v) => v, 'validation.termsRequired'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMismatch' });
export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email });
export type ForgotForm = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({ password: strongPassword, confirmPassword: z.string().min(1, 'validation.required') })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'validation.passwordMismatch' });
export type ResetForm = z.infer<typeof resetSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'validation.titleShort').max(120, 'validation.titleLong'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  projectId: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
});
export type TaskForm = z.infer<typeof taskSchema>;
