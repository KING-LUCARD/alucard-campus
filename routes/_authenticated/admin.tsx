import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalShell, PortalSection, StatCards, EmptyNote, PortalDenied, FormMessage } from '@/components/portal';
import { getAdminPortal, adminSetUser, adminSetEnrollment, adminAssignTeacher, postAnnouncement } from '@/lib/portal.functions';
import { AdmissionsPanel, AssignmentsPanel, AuditPanel } from '@/components/extras-admin';
import { TimetablePanel, LibraryPanel } from '@/components/extras-school';
import { pageHead } from '@/lib/metadata';

const adminQuery = queryOptions({ queryKey: ['admin-portal'], queryFn: () => getAdminPortal() });

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => pageHead('Admin portal', 'Alucard Institute administration: accounts, roles, classes, teachers and announcements.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  errorComponent: () => <PortalDenied area="administrators" />,
  notFoundComponent: () => <p className="px-6 pb-24 pt-40">Not found.</p>,
  component: AdminPortal,
});

const relName = (v: unknown) => (v as { name?: string } | null)?.name ?? '—';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
type Status = 'pending' | 'approved' | 'rejected' | 'suspended';
type Role = 'admin' | 'principal' | 'teacher' | 'student';

function AdminPortal() {
  const { data } = useSuspenseQuery(adminQuery);
  const queryClient = useQueryClient();
  const setUser = useServerFn(adminSetUser);
  const setEnrollment = useServerFn(adminSetEnrollment);
  const assignTeacher = useServerFn(adminAssignTeacher);
  const announce = useServerFn(postAnnouncement);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [placeStudent, setPlaceStudent] = useState('');
  const [placeClass, setPlaceClass] = useState('');
  const [placeDept, setPlaceDept] = useState<'Science' | 'Commercial' | 'Arts' | ''>('');
  const [assignClass, setAssignClass] = useState('');
  const [assignSubject, setAssignSubject] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const roleOf = (userId: string): Role | null => (data.roles.find((r) => r.user_id === userId && r.active)?.role as Role | undefined) ?? null;
  const teachers = data.users.filter((u) => roleOf(u.id) === 'teacher');
  const students = data.users.filter((u) => roleOf(u.id) === 'student');
  const enrolledIds = new Set(data.enrollments.map((e) => e.student_id));
  const unplacedStudents = students.filter((s) => !enrolledIds.has(s.id));

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(ok);
      await queryClient.invalidateQueries({ queryKey: ['admin-portal'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'The action failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell eyebrow="Alucard Institute" title="Admin portal" blurb="Manage accounts, roles, class placement, teaching assignments and school announcements.">
      <StatCards stats={[
        { label: 'Registered accounts', value: data.users.length },
        { label: 'Pending access requests', value: data.requests.length },
        { label: 'Students placed in classes', value: data.enrollments.filter((e) => e.status === 'approved').length },
        { label: 'Teaching assignments', value: data.teaching.length },
      ]} />
      <FormMessage message={message} tone={message?.includes('saved') || message?.includes('updated') || message?.includes('posted') ? 'success' : 'error'} />

      <PortalSection title="Pending access requests">
        {data.requests.length === 0 ? <EmptyNote>No requests are waiting for review.</EmptyNote> : (
          <div className="space-y-3">
            {data.requests.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-medium">{(r.profiles as { display_name?: string } | null)?.display_name || 'Unnamed'} <span className="text-muted-foreground">· {(r.profiles as { email?: string } | null)?.email}</span></p>
                    <p className="text-sm text-muted-foreground">Requested <span className="capitalize">{r.requested_role}</span> access · {fmtDate(r.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => void run(() => setUser({ data: { target: r.user_id, status: 'approved', role: r.requested_role } }), 'Request approved and role saved.')}>Approve</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => setUser({ data: { target: r.user_id, status: 'rejected', role: null } }), 'Request rejected.')}>Reject</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PortalSection>

      <PortalSection title="Accounts">
        <div className="space-y-3">
          {data.users.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.display_name || 'Unnamed'} <span className="text-muted-foreground">· {u.email}</span></p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant={u.status === 'approved' ? 'default' : 'secondary'} className="capitalize">{u.status}</Badge>
                    {roleOf(u.id) && <Badge variant="outline" className="capitalize">{roleOf(u.id)}</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select defaultValue={u.status} onValueChange={(v) => void run(() => setUser({ data: { target: u.id, status: v as Status, role: roleOf(u.id) } }), 'Account status updated.')}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['pending', 'approved', 'suspended'] as const).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={roleOf(u.id) ?? ''} onValueChange={(v) => void run(() => setUser({ data: { target: u.id, status: 'approved', role: v as Role } }), 'Role updated and account approved.')}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Set role" /></SelectTrigger>
                    <SelectContent>
                      {(['student', 'teacher', 'principal', 'admin'] as const).map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Place a student in a class">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Student</Label>
              <Select value={placeStudent} onValueChange={setPlaceStudent}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Choose student" /></SelectTrigger>
                <SelectContent>{unplacedStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name || s.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class</Label>
              <Select value={placeClass} onValueChange={setPlaceClass}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Choose class" /></SelectTrigger>
                <SelectContent>{data.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department (senior only)</Label>
              <Select value={placeDept} onValueChange={(v) => setPlaceDept(v as typeof placeDept)}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>{(['Science', 'Commercial', 'Arts'] as const).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button disabled={busy || !placeStudent || !placeClass} onClick={() => void run(() => setEnrollment({ data: { target: placeStudent, class_id: placeClass, department: placeDept || null } }), 'Student placement saved.')}>Save placement</Button>
            </div>
          </CardContent>
        </Card>
        {data.enrollments.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {data.enrollments.map((e) => (
              <li key={e.student_id} className="flex flex-wrap gap-2 rounded-lg border p-3">
                <span className="font-medium">{relName(e.profiles) !== '—' ? relName(e.profiles) : (e.profiles as { email?: string } | null)?.email}</span>
                <span className="text-muted-foreground">→ {relName(e.classes)}{e.department ? ` · ${e.department}` : ''} · {e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </PortalSection>

      <PortalSection title="Assign a teacher to a class and subject">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Class</Label>
              <Select value={assignClass} onValueChange={setAssignClass}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Choose class" /></SelectTrigger>
                <SelectContent>{data.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={assignSubject} onValueChange={setAssignSubject}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Choose subject" /></SelectTrigger>
                <SelectContent>{data.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Choose teacher" /></SelectTrigger>
                <SelectContent>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.display_name || t.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button disabled={busy || !assignClass || !assignSubject || !assignTeacherId} onClick={() => void run(() => assignTeacher({ data: { class_id: assignClass, subject_id: assignSubject, teacher_id: assignTeacherId } }), 'Teaching assignment saved.')}>Save assignment</Button>
            </div>
          </CardContent>
        </Card>
        {data.teaching.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {data.teaching.map((t) => (
              <li key={t.id} className="rounded-lg border p-3">{relName(t.classes)} · {relName(t.subjects)} — <span className="text-muted-foreground">{relName(t.profiles)}</span></li>
            ))}
          </ul>
        )}
      </PortalSection>

      <PortalSection title="School announcement">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="notice-title">Title</Label>
              <Input id="notice-title" className="mt-2" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} maxLength={140} />
            </div>
            <div>
              <Label htmlFor="notice-body">Message</Label>
              <Textarea id="notice-body" className="mt-2" rows={4} value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} maxLength={4000} />
            </div>
            <Button disabled={busy || noticeTitle.trim().length < 3 || noticeBody.trim().length < 3} onClick={() => void run(async () => { await announce({ data: { title: noticeTitle, body: noticeBody, class_id: null } }); setNoticeTitle(''); setNoticeBody(''); }, 'Announcement posted.')}>Post to whole school</Button>
          </CardContent>
        </Card>
      </PortalSection>

      <PortalSection title="Recent activity">
        {data.audit.length === 0 ? <EmptyNote>No recorded activity yet.</EmptyNote> : (
          <ul className="space-y-2 text-sm">
            {data.audit.map((a) => <li key={a.id} className="flex justify-between gap-4 rounded-lg border p-3"><span>{a.action}</span><span className="text-muted-foreground">{fmtDate(a.created_at)}</span></li>)}
          </ul>
        )}
      </PortalSection>
      <AdmissionsPanel />
      <AssignmentsPanel />
      <AuditPanel />
      <TimetablePanel />
      <LibraryPanel />
    </PortalShell>
  );
}
