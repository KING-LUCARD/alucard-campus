import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { applicationSchema, contactSchema } from './school-validation';

export const submitApplication = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input) => applicationSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: row, error } = await context.supabase.from('admission_applications').insert({ ...data, user_id: context.userId }).select('id,status').single();
  if (error) throw new Error('Your application could not be saved. Please try again.');
  return row;
});
export const submitContact = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input) => contactSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: row, error } = await context.supabase.from('contact_messages').insert({ ...data, user_id: context.userId }).select('id').single();
  if (error) throw new Error('Your message could not be saved. Please try again.');
  return row;
});
export const getAccount = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [profile, roles, requests, applications] = await Promise.all([
    context.supabase.from('profiles').select('display_name,email').eq('id',context.userId).single(),
    context.supabase.from('user_roles').select('role').eq('user_id',context.userId).eq('active',true),
    context.supabase.from('role_requests').select('id,requested_role,status').eq('user_id',context.userId),
    context.supabase.from('admission_applications').select('id,student_name,entry_year,status,created_at').eq('user_id',context.userId).order('created_at',{ ascending:false }),
  ]);
  if (profile.error || roles.error || requests.error || applications.error) throw new Error('Your school account could not be loaded.');
  return { profile: profile.data, roles: roles.data, requests: requests.data, applications: applications.data };
});
export const getAdminInbox = createServerFn({ method:'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: allowed } = await context.supabase.rpc('has_school_role',{ wanted:'admin' });
  if (!allowed) throw new Error('Administrator access and two-step verification required.');
  const [requests, applications, messages, audit] = await Promise.all([
    context.supabase.from('role_requests').select('id,requested_role,status,profiles(display_name,email)').eq('status','pending').order('created_at'),
    context.supabase.from('admission_applications').select('id,student_name,guardian_name,email,entry_year,status').order('created_at',{ascending:false}).limit(100),
    context.supabase.from('contact_messages').select('id,name,email,subject,message').order('created_at',{ascending:false}).limit(100),
    context.supabase.from('audit_logs').select('id,action,created_at').order('created_at',{ascending:false}).limit(30),
  ]);
  if(requests.error || applications.error || messages.error || audit.error) throw new Error('The school inbox could not be loaded.');
  return { requests:requests.data, applications:applications.data, messages:messages.data, audit:audit.data };
});
export const reviewRequest = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ request_id:z.string().uuid(), approve:z.boolean() }).parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc('review_role_request',data);
  if(error) throw new Error(error.message);
  return { success:true };
});