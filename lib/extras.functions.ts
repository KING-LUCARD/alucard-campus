import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

type Role = 'admin' | 'principal' | 'teacher' | 'student';
const NO_ACCESS = 'NO_PORTAL_ACCESS';
const uuid = z.string().uuid();
const sessionSchema = z.string().regex(/^[0-9]{4}\/[0-9]{4}$/, 'Use a session like 2026/2027');
const termSchema = z.number().int().min(1).max(3);

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
// New tables are not in the generated types file yet, so the client is used loosely here; RLS still enforces access.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = (c: { supabase: unknown }): any => c.supabase;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireRole(supabase: any, role: Role) {
  const { data, error } = await supabase.rpc('has_school_role', { wanted: role });
  if (error || !data) throw new Error(NO_ACCESS);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAny(supabase: any, roles: Role[]) {
  for (const r of roles) {
    const { data } = await supabase.rpc('has_school_role', { wanted: r });
    if (data) return r;
  }
  throw new Error(NO_ACCESS);
}
function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/* ------------------------------ Admissions (admin) ------------------------------ */

export const getAdmissionsAdmin = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(sb(context), 'admin');
  const [apps, classes] = await Promise.all([
    sb(context).from('admission_applications').select('id,user_id,student_name,guardian_name,email,phone,entry_year,notes,status,created_at').order('created_at', { ascending: false }).limit(300),
    sb(context).from('classes').select('id,name,senior').order('sort'),
  ]);
  fail(apps.error); fail(classes.error);
  return { applications: apps.data ?? [], classes: classes.data ?? [] };
});

export const reviewApplication = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ application_id: uuid, status: z.enum(['submitted', 'reviewing', 'accepted', 'declined']) }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).rpc('admin_review_application', { app: data.application_id, new_status: data.status });
    fail(error);
    return { success: true };
  });

export const convertApplicant = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ application_id: uuid, class_id: uuid, department: z.enum(['Science', 'Commercial', 'Arts']).nullable() }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).rpc('admin_convert_applicant', { app: data.application_id, cls: data.class_id, dept: data.department });
    fail(error);
    return { success: true };
  });

/* ------------------------------ Admin: assignments, grades, audit, exports ------------------------------ */

export const getAdminAssignments = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(sb(context), 'admin');
  const [assignments, submissions] = await Promise.all([
    sb(context).from('assignments').select('id,title,instructions,due_at,total_marks,classes(name),subjects(name),profiles(display_name)').order('created_at', { ascending: false }).limit(200),
    sb(context).from('submissions').select('id,assignment_id,score,feedback,published,profiles(display_name,email)').not('score', 'is', null).limit(1000),
  ]);
  fail(assignments.error); fail(submissions.error);
  return { assignments: assignments.data ?? [], submissions: submissions.data ?? [] };
});

export const adminUpdateAssignment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: uuid, title: z.string().trim().min(3).max(160), instructions: z.string().max(5000), due_at: z.string().datetime({ offset: true }), total_marks: z.number().int().min(1).max(1000) }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).rpc('admin_update_assignment', { a_id: data.id, new_title: data.title, new_instructions: data.instructions, new_due: data.due_at, new_marks: data.total_marks });
    fail(error);
    return { success: true };
  });

export const adminDeleteAssignment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: uuid }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).rpc('admin_delete_assignment', { a_id: data.id });
    fail(error);
    return { success: true };
  });

export const adminCorrectGrade = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ submission_id: uuid, score: z.number().min(0).max(1000), feedback: z.string().max(2000) }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).rpc('admin_correct_grade', { sub: data.submission_id, new_score: data.score, new_feedback: data.feedback });
    fail(error);
    return { success: true };
  });

export const getAuditLog = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(sb(context), 'admin');
  const { data, error } = await sb(context).from('audit_logs').select('id,action,actor_id,target_id,created_at').order('created_at', { ascending: false }).limit(500);
  fail(error);
  const ids = Array.from(new Set((data ?? []).flatMap((r: Row) => [r.actor_id, r.target_id]).filter(Boolean))) as string[];
  const names = ids.length ? await sb(context).from('profiles').select('id,display_name,email').in('id', ids) : { data: [], error: null };
  fail(names.error);
  const map = new Map((names.data ?? []).map((p: Row) => [p.id, p.display_name || p.email]));
  return (data ?? []).map((r: Row) => ({ id: r.id, action: r.action, created_at: r.created_at, actor: r.actor_id ? map.get(r.actor_id) ?? 'Unknown' : 'System', target: r.target_id ? map.get(r.target_id) ?? r.target_id : '' }));
});

export const getExportData = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ kind: z.enum(['students', 'applications', 'grades']) }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    if (data.kind === 'students') {
      const { data: rows, error } = await sb(context).from('enrollments').select('department,status,profiles(display_name,email),classes(name)').limit(5000);
      fail(error);
      return (rows ?? []).map((r: Row) => ({ Name: (r.profiles as { display_name?: string } | null)?.display_name ?? '', Email: (r.profiles as { email?: string } | null)?.email ?? '', Class: (r.classes as { name?: string } | null)?.name ?? '', Department: r.department ?? '', Status: r.status }));
    }
    if (data.kind === 'applications') {
      const { data: rows, error } = await sb(context).from('admission_applications').select('student_name,guardian_name,email,phone,entry_year,status,created_at').order('created_at', { ascending: false }).limit(5000);
      fail(error);
      return (rows ?? []).map((r: Row) => ({ Student: r.student_name, Guardian: r.guardian_name, Email: r.email, Phone: r.phone, 'Entry class': r.entry_year, Status: r.status, Applied: r.created_at }));
    }
    const { data: rows, error } = await sb(context).from('term_results').select('term,session,ca_score,exam_score,remark,profiles!term_results_student_id_fkey(display_name,email),classes(name),subjects(name)').limit(20000);
    fail(error);
    return (rows ?? []).map((r: Row) => ({ Session: r.session, Term: r.term, Class: (r.classes as { name?: string } | null)?.name ?? '', Student: (r.profiles as { display_name?: string } | null)?.display_name ?? '', Subject: (r.subjects as { name?: string } | null)?.name ?? '', CA: r.ca_score, Exam: r.exam_score, Total: Number(r.ca_score) + Number(r.exam_score), Remark: r.remark }));
  });

/* ------------------------------ Library / resources ------------------------------ */

export const getLibrary = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await requireAny(sb(context), ['student', 'teacher', 'admin', 'principal']);
  const [resources, classes, subjects] = await Promise.all([
    sb(context).from('resources').select('id,class_id,title,description,kind,file_name,created_at,classes(name),subjects(name)').order('created_at', { ascending: false }).limit(300),
    sb(context).from('classes').select('id,name').order('sort'),
    sb(context).from('subjects').select('id,name').order('name'),
  ]);
  fail(resources.error); fail(classes.error); fail(subjects.error);
  let teachable = classes.data ?? [];
  if (role === 'teacher') {
    const mine = await sb(context).from('teaching_assignments').select('class_id').eq('teacher_id', (await sb(context).auth.getUser()).data.user?.id ?? '');
    fail(mine.error);
    const ids = new Set((mine.data ?? []).map((m: Row) => m.class_id));
    teachable = teachable.filter((c: Row) => ids.has(c.id));
  } else if (role !== 'admin') teachable = [];
  return { resources: resources.data ?? [], classes: teachable, subjects: subjects.data ?? [] };
});

export const createResource = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    class_id: uuid, subject_id: uuid.nullable(), title: z.string().trim().min(2).max(160), description: z.string().max(1000),
    kind: z.enum(['book', 'notes', 'past_questions', 'other']), file_path: z.string().min(10).max(300), file_name: z.string().min(1).max(200),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAny(sb(context), ['teacher', 'admin']);
    if (!data.file_path.startsWith(`${data.class_id}/`) || data.file_path.includes('..')) throw new Error('Invalid file location.');
    const user = (await sb(context).auth.getUser()).data.user;
    const { error } = await sb(context).from('resources').insert({ ...data, uploaded_by: user?.id ?? '' });
    fail(error);
    return { success: true };
  });

export const getResourceLink = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: uuid }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await sb(context).from('resources').select('file_path,file_name').eq('id', data.id).maybeSingle();
    fail(error);
    if (!row) throw new Error('Resource not found.');
    const { data: signed, error: e2 } = await sb(context).storage.from('resources').createSignedUrl(row.file_path, 300, { download: row.file_name });
    fail(e2);
    return { url: signed?.signedUrl ?? '' };
  });

export const deleteResource = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: uuid }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAny(sb(context), ['teacher', 'admin']);
    const { data: row, error } = await sb(context).from('resources').select('file_path').eq('id', data.id).maybeSingle();
    fail(error);
    if (!row) throw new Error('Resource not found.');
    const del = await sb(context).from('resources').delete().eq('id', data.id).select('id');
    fail(del.error);
    if (!del.data?.length) throw new Error('You cannot remove this resource.');
    await sb(context).storage.from('resources').remove([row.file_path]);
    return { success: true };
  });

/* ------------------------------ Timetable ------------------------------ */

export const getTimetable = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await requireAny(sb(context), ['admin', 'principal', 'teacher', 'student']);
  const [entries, classes, subjects] = await Promise.all([
    sb(context).from('timetable_entries').select('id,class_id,subject_id,day,start_time,end_time,room,classes(name),subjects(name)').order('day').order('start_time'),
    sb(context).from('classes').select('id,name').order('sort'),
    sb(context).from('subjects').select('id,name').order('name'),
  ]);
  fail(entries.error); fail(classes.error); fail(subjects.error);
  return { entries: entries.data ?? [], classes: classes.data ?? [], subjects: subjects.data ?? [], canEdit: role === 'admin' };
});

const timeSchema = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);
export const saveTimetableEntry = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ class_id: uuid, subject_id: uuid, day: z.number().int().min(1).max(5), start_time: timeSchema, end_time: timeSchema, room: z.string().max(60) }).refine((v) => v.end_time > v.start_time, 'End time must be after start time').parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).from('timetable_entries').insert(data);
    if (error) throw new Error(error.code === '23505' ? 'That class already has a lesson starting at that time.' : error.message);
    return { success: true };
  });
export const deleteTimetableEntry = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: uuid }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'admin');
    const { error } = await sb(context).from('timetable_entries').delete().eq('id', data.id);
    fail(error);
    return { success: true };
  });

/* ------------------------------ Term results and report cards ------------------------------ */

export const getResultsSheet = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ class_id: uuid, term: termSchema, session: sessionSchema }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAny(sb(context), ['teacher', 'principal', 'admin']);
    const [roster, results, sheet, subjects] = await Promise.all([
      sb(context).from('enrollments').select('student_id,profiles(display_name,email)').eq('class_id', data.class_id).eq('status', 'approved'),
      sb(context).from('term_results').select('student_id,subject_id,ca_score,exam_score,remark').eq('class_id', data.class_id).eq('term', data.term).eq('session', data.session),
      sb(context).from('result_sheets').select('status').eq('class_id', data.class_id).eq('term', data.term).eq('session', data.session).maybeSingle(),
      sb(context).from('teaching_assignments').select('subject_id,subjects(name)').eq('class_id', data.class_id),
    ]);
    fail(roster.error); fail(results.error); fail(sheet.error); fail(subjects.error);
    return { roster: roster.data ?? [], results: results.data ?? [], status: sheet.data?.status ?? 'draft', subjects: subjects.data ?? [] };
  });

export const getResultOverview = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAny(sb(context), ['teacher', 'principal', 'admin']);
  const [sheets, classes, teaching] = await Promise.all([
    sb(context).from('result_sheets').select('class_id,term,session,status,classes(name)').order('updated_at', { ascending: false }).limit(100),
    sb(context).from('classes').select('id,name').order('sort'),
    sb(context).from('teaching_assignments').select('class_id,subject_id'),
  ]);
  fail(sheets.error); fail(classes.error); fail(teaching.error);
  const mine = new Set((teaching.data ?? []).map((t: Row) => t.class_id));
  return { sheets: sheets.data ?? [], classes: classes.data ?? [], teachingClassIds: Array.from(mine) };
});

export const saveResults = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({
    class_id: uuid, subject_id: uuid, term: termSchema, session: sessionSchema,
    rows: z.array(z.object({ student_id: uuid, ca_score: z.number().min(0).max(40), exam_score: z.number().min(0).max(60), remark: z.string().max(200) })).min(1).max(200),
  }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'teacher');
    const user = (await sb(context).auth.getUser()).data.user;
    const rows = data.rows.map((r: Row) => ({ ...r, class_id: data.class_id, subject_id: data.subject_id, term: data.term, session: data.session, entered_by: user?.id ?? '' }));
    const { error } = await sb(context).from('term_results').upsert(rows, { onConflict: 'student_id,subject_id,term,session' });
    if (error) throw new Error(error.code === '42501' ? 'You cannot edit these results (not your subject, or already published).' : error.message);
    return { success: true };
  });

export const submitResultSheet = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ class_id: uuid, term: termSchema, session: sessionSchema }).parse(i))
  .handler(async ({ context, data }) => {
    await requireAny(sb(context), ['teacher', 'admin']);
    const { error } = await sb(context).rpc('submit_result_sheet', { cls: data.class_id, t: data.term, s: data.session });
    fail(error);
    return { success: true };
  });

export const reviewResultSheet = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ class_id: uuid, term: termSchema, session: sessionSchema, publish: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    await requireRole(sb(context), 'principal');
    const { error } = await sb(context).rpc('principal_review_sheet', { cls: data.class_id, t: data.term, s: data.session, publish: data.publish });
    fail(error);
    return { success: true };
  });

export const getMyReportCards = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireRole(sb(context), 'student');
  const [results, me] = await Promise.all([
    sb(context).from('term_results').select('term,session,ca_score,exam_score,remark,subjects(name),classes(name)').order('session', { ascending: false }).order('term', { ascending: false }),
    sb(context).from('profiles').select('display_name,email').eq('id', (await sb(context).auth.getUser()).data.user?.id ?? '').maybeSingle(),
  ]);
  fail(results.error); fail(me.error);
  return { results: results.data ?? [], student: me.data?.display_name || me.data?.email || 'Student' };
});
