import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

type Role = 'admin' | 'principal' | 'teacher' | 'student';

const NO_ACCESS = 'NO_PORTAL_ACCESS';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireRole(supabase: any, role: Role) {
  const { data, error } = await supabase.rpc('has_school_role', { wanted: role });
  if (error || !data) throw new Error(NO_ACCESS);
}

const uuid = z.string().uuid();

/* ------------------------------ Admin ------------------------------ */

export const getAdminPortal = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(context.supabase, 'admin');
  const [users, roles, requests, classes, subjects, teaching, enrollments, audit, announcements] = await Promise.all([
    context.supabase.from('profiles').select('id,display_name,email,status,created_at').order('created_at', { ascending: false }).limit(200),
    context.supabase.from('user_roles').select('user_id,role,active'),
    context.supabase.from('role_requests').select('id,user_id,requested_role,status,created_at,profiles(display_name,email)').eq('status', 'pending').order('created_at'),
    context.supabase.from('classes').select('id,name,sort,senior').order('sort'),
    context.supabase.from('subjects').select('id,name,core,department').order('name'),
    context.supabase.from('teaching_assignments').select('id,class_id,subject_id,teacher_id,classes(name),subjects(name),profiles(display_name)'),
    context.supabase.from('enrollments').select('student_id,class_id,department,status,profiles(display_name,email),classes(name)').order('created_at', { ascending: false }),
    context.supabase.from('audit_logs').select('id,action,created_at').order('created_at', { ascending: false }).limit(20),
    context.supabase.from('announcements').select('id,title,body,created_at,class_id,classes(name)').order('created_at', { ascending: false }).limit(20),
  ]);
  const firstError = [users, roles, requests, classes, subjects, teaching, enrollments, audit, announcements].find((r) => r.error);
  if (firstError?.error) throw new Error('The admin dashboard could not be loaded.');
  return {
    users: users.data, roles: roles.data, requests: requests.data, classes: classes.data,
    subjects: subjects.data, teaching: teaching.data, enrollments: enrollments.data,
    audit: audit.data, announcements: announcements.data,
  };
});

export const adminSetUser = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    target: uuid,
    status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
    role: z.enum(['admin', 'principal', 'teacher', 'student']).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc('admin_set_user', { target: data.target, new_status: data.status, new_role: data.role });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminSetEnrollment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    target: uuid,
    class_id: uuid,
    department: z.enum(['Science', 'Commercial', 'Arts']).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc('admin_set_enrollment', { target: data.target, cls: data.class_id, dept: data.department });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminAssignTeacher = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ class_id: uuid, subject_id: uuid, teacher_id: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc('admin_assign_teacher', { cls: data.class_id, subj: data.subject_id, teacher: data.teacher_id });
    if (error) throw new Error(error.message);
    return { success: true };
  });

/* ----------------------------- Teacher ----------------------------- */

export const getTeacherPortal = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(context.supabase, 'teacher');
  const [teaching, assignments, announcements] = await Promise.all([
    context.supabase.from('teaching_assignments').select('id,class_id,subject_id,classes(name,sort),subjects(name)').eq('teacher_id', context.userId),
    context.supabase.from('assignments').select('id,class_id,subject_id,title,instructions,due_at,total_marks,classes(name),subjects(name)').eq('teacher_id', context.userId).order('due_at'),
    context.supabase.from('announcements').select('id,title,body,created_at,class_id,classes(name)').order('created_at', { ascending: false }).limit(20),
  ]);
  if (teaching.error || assignments.error || announcements.error) throw new Error('The teacher dashboard could not be loaded.');
  const ids = (assignments.data ?? []).map((a) => a.id);
  const submissions = ids.length
    ? await context.supabase.from('submissions').select('id,assignment_id,student_id,body,score,feedback,published,submitted_at,profiles(display_name)').in('assignment_id', ids)
    : { data: [], error: null };
  if (submissions.error) throw new Error('The teacher dashboard could not be loaded.');
  return { teaching: teaching.data, assignments: assignments.data, submissions: submissions.data, announcements: announcements.data };
});

export const getClassRoster = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ class_id: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('enrollments')
      .select('student_id,department,profiles(display_name,email)')
      .eq('class_id', data.class_id)
      .eq('status', 'approved')
      .order('created_at');
    if (error) throw new Error('The class roster could not be loaded.');
    return rows;
  });

export const createAssignment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    class_id: uuid,
    subject_id: uuid,
    title: z.string().trim().min(3).max(120),
    instructions: z.string().trim().max(4000).default(''),
    due_at: z.string().datetime(),
    total_marks: z.number().int().min(1).max(1000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('assignments').insert({ ...data, teacher_id: context.userId });
    if (error) throw new Error('The assignment could not be saved. Check that you teach this class and subject.');
    return { success: true };
  });

export const gradeSubmission = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: uuid,
    score: z.number().min(0).max(1000),
    feedback: z.string().trim().max(2000).default(''),
    published: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('submissions').update({ score: data.score, feedback: data.feedback, published: data.published }).eq('id', data.id);
    if (error) throw new Error('The grade could not be saved.');
    return { success: true };
  });

export const takeAttendance = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    class_id: uuid,
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    records: z.array(z.object({ student_id: uuid, present: z.boolean() })).min(1).max(200),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const rows = data.records.map((r) => ({ ...r, class_id: data.class_id, day: data.day, recorded_by: context.userId }));
    const { error } = await context.supabase.from('attendance').upsert(rows, { onConflict: 'student_id,day' });
    if (error) throw new Error('Attendance could not be saved. Check that you teach this class.');
    return { success: true };
  });

export const postAnnouncement = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    title: z.string().trim().min(3).max(140),
    body: z.string().trim().min(3).max(4000),
    class_id: uuid.nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('announcements').insert({ ...data, author_id: context.userId });
    if (error) throw new Error('The announcement could not be posted.');
    return { success: true };
  });

/* ----------------------------- Student ----------------------------- */

export const getStudentPortal = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(context.supabase, 'student');
  const enrollment = await context.supabase.from('enrollments').select('class_id,department,status,classes(name,senior)').eq('student_id', context.userId).maybeSingle();
  if (enrollment.error) throw new Error('The student dashboard could not be loaded.');
  const classId = enrollment.data?.status === 'approved' ? enrollment.data.class_id : null;
  const [classes, teaching, assignments, submissions, attendance, announcements] = await Promise.all([
    context.supabase.from('classes').select('id,name,senior').order('sort'),
    classId ? context.supabase.from('teaching_assignments').select('subjects(name),profiles(display_name)').eq('class_id', classId) : Promise.resolve({ data: [], error: null }),
    classId ? context.supabase.from('assignments').select('id,title,instructions,due_at,total_marks,subjects(name)').eq('class_id', classId).order('due_at') : Promise.resolve({ data: [], error: null }),
    context.supabase.from('submissions').select('id,assignment_id,body,score,feedback,published,submitted_at').eq('student_id', context.userId),
    context.supabase.from('attendance').select('day,present').eq('student_id', context.userId).order('day', { ascending: false }).limit(60),
    context.supabase.from('announcements').select('id,title,body,created_at,class_id,classes(name)').order('created_at', { ascending: false }).limit(20),
  ]);
  if (classes.error || teaching.error || assignments.error || submissions.error || attendance.error || announcements.error) {
    throw new Error('The student dashboard could not be loaded.');
  }
  return {
    enrollment: enrollment.data,
    classes: classes.data,
    subjects: teaching.data,
    assignments: assignments.data,
    submissions: submissions.data,
    attendance: attendance.data,
    announcements: announcements.data,
  };
});

export const requestEnrollment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    class_id: uuid,
    department: z.enum(['Science', 'Commercial', 'Arts']).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('enrollments').insert({ student_id: context.userId, class_id: data.class_id, department: data.department, status: 'requested' });
    if (error) throw new Error('Your class request could not be saved. You may already have one.');
    return { success: true };
  });

export const submitAssignment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ assignment_id: uuid, body: z.string().trim().min(1).max(10000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('submissions').insert({ assignment_id: data.assignment_id, student_id: context.userId, body: data.body });
    if (error) throw new Error('Your work could not be submitted. The deadline may have passed or you may have already submitted.');
    return { success: true };
  });

/* ---------------------------- Principal ---------------------------- */

export const getPrincipalPortal = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(context.supabase, 'principal');
  const [users, roles, classes, enrollments, teaching, attendance, assignments, submissions, announcements] = await Promise.all([
    context.supabase.from('profiles').select('id,status'),
    context.supabase.from('user_roles').select('user_id,role,active'),
    context.supabase.from('classes').select('id,name,sort,senior').order('sort'),
    context.supabase.from('enrollments').select('student_id,class_id,department,status,profiles(display_name),classes(name)'),
    context.supabase.from('teaching_assignments').select('id,classes(name),subjects(name),profiles(display_name)'),
    context.supabase.from('attendance').select('day,present,class_id').order('day', { ascending: false }).limit(500),
    context.supabase.from('assignments').select('id,title,due_at,classes(name),subjects(name)'),
    context.supabase.from('submissions').select('id,assignment_id,score,published,submitted_at'),
    context.supabase.from('announcements').select('id,title,body,created_at,class_id,classes(name)').order('created_at', { ascending: false }).limit(20),
  ]);
  const firstError = [users, roles, classes, enrollments, teaching, attendance, assignments, submissions, announcements].find((r) => r.error);
  if (firstError?.error) throw new Error('The principal dashboard could not be loaded.');
  return {
    users: users.data, roles: roles.data, classes: classes.data, enrollments: enrollments.data,
    teaching: teaching.data, attendance: attendance.data, assignments: assignments.data,
    submissions: submissions.data, announcements: announcements.data,
  };
});
