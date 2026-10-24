import { z } from 'zod';

export const requestedRoleSchema = z.enum(['student', 'teacher']);
export const applicationSchema = z.object({ student_name: z.string().trim().min(2).max(100), guardian_name: z.string().trim().min(2).max(100), email: z.string().email().max(254), phone: z.string().trim().min(7).max(30), entry_year: z.enum(['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']), notes: z.string().trim().max(2000).default('') });
export const contactSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254), subject: z.string().trim().min(2).max(150), message: z.string().trim().min(10).max(4000) });
export const registrationSchema = z.object({ display_name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(12).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/), requested_role: requestedRoleSchema });