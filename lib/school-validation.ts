import { z } from 'zod';

export const requestedRoleSchema = z.enum(['student', 'teacher']);
export const applicationSchema = z.object({ student_name: z.string().trim().min(2).max(100), guardian_name: z.string().trim().min(2).max(100), email: z.string().email().max(254), phone: z.string().trim().min(7).max(30), entry_year: z.enum(['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']), notes: z.string().trim().max(2000).default('') });
export const contactSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254), subject: z.string().trim().min(2).max(150), message: z.string().trim().min(10).max(4000) });
export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,20}$/, 'Use 3–20 lowercase letters, numbers or underscores.');
export const passwordSchema = z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
export const registrationSchema = z.object({ display_name: z.string().trim().min(2).max(100), username: usernameSchema, email: z.string().trim().toLowerCase().email().max(254), password: passwordSchema, confirm_password: z.string(), requested_role: requestedRoleSchema }).refine((v) => v.password === v.confirm_password, { path: ['confirm_password'], message: 'Passwords do not match.' });
export const otpSchema = z.string().trim().regex(/^[0-9]{6}$/, 'Enter the 6-digit code.');
export const usernameLoginSchema = z.object({ identifier: z.string().trim().toLowerCase().min(3).max(254), password: z.string().min(1).max(128) });
