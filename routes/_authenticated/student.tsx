import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalShell, PortalSection, StatCards, EmptyNote, PortalDenied, FormMessage } from '@/components/portal';
import { getStudentPortal, requestEnrollment, submitAssignment } from '@/lib/portal.functions';
import { TimetablePanel, LibraryPanel, ReportCardPanel } from '@/components/extras-school';
import { pageHead } from '@/lib/metadata';

const studentQuery = queryOptions({ queryKey: ['student-portal'], queryFn: () => getStudentPortal() });

export const Route = createFileRoute('/_authenticated/student')({
  head: () => pageHead('Student portal', 'Alucard Institute student dashboard: class, subjects, assignments, grades and attendance.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentQuery),
  errorComponent: () => <PortalDenied area="students" />,
  notFoundComponent: () => <p className="px-6 pb-24 pt-40">Not found.</p>,
  component: StudentPortal,
});

const relName = (v: unknown) => (v as { name?: string } | null)?.name ?? '—';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function StudentPortal() {
  const { data } = useSuspenseQuery(studentQuery);
  const queryClient = useQueryClient();
  const enrollFn = useServerFn(requestEnrollment);
  const submitFn = useServerFn(submitAssignment);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [classId, setClassId] = useState('');
  const [dept, setDept] = useState<'Science' | 'Commercial' | 'Arts' | ''>('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const enrollment = data.enrollment;
  const approved = enrollment?.status === 'approved';
  const chosenClass = data.classes.find((c) => c.id === classId);
  const attended = data.attendance.filter((a) => a.present).length;
  const attendanceRate = data.attendance.length ? Math.round((attended / data.attendance.length) * 100) : null;
  const now = Date.now();
  const openAssignments = data.assignments.filter((a) => new Date(a.due_at).getTime() > now && !data.submissions.some((s) => s.assignment_id === a.id));

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(ok);
      await queryClient.invalidateQueries({ queryKey: ['student-portal'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'The action failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!approved) {
    return (
      <PortalShell eyebrow="Alucard Institute" title="Student portal" blurb="Choose your class to get started. The school office will confirm your placement.">
        <FormMessage message={message} tone={message?.includes('sent') ? 'success' : 'error'} />
        {enrollment?.status === 'requested' ? (
          <EmptyNote>Your class placement request is waiting for the school office to confirm it. Check back soon.</EmptyNote>
        ) : (
          <Card className="max-w-xl">
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choose your class" /></SelectTrigger>
                  <SelectContent>{data.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {chosenClass?.senior && (
                <div>
                  <Label>Department</Label>
                  <Select value={dept} onValueChange={(v) => setDept(v as typeof dept)}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Choose department" /></SelectTrigger>
                    <SelectContent>{(['Science', 'Commercial', 'Arts'] as const).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <Button disabled={busy || !classId || (chosenClass?.senior === true && !dept)} onClick={() => void run(() => enrollFn({ data: { class_id: classId, department: chosenClass?.senior ? dept || null : null } }), 'Your request was sent to the school office.')}>Request placement</Button>
            </CardContent>
          </Card>
        )}
      </PortalShell>
    );
  }

  return (
    <PortalShell eyebrow="Alucard Institute" title="Student portal" blurb={`${relName(enrollment.classes)}${enrollment.department ? ` · ${enrollment.department} department` : ''} — your subjects, assignments, grades and attendance.`}>
      <StatCards stats={[
        { label: 'My class', value: relName(enrollment.classes) },
        { label: 'Subjects', value: data.subjects.length },
        { label: 'Open assignments', value: openAssignments.length },
        { label: 'Attendance rate', value: attendanceRate === null ? '—' : `${attendanceRate}%`, hint: 'Last 60 school days' },
      ]} />
      <FormMessage message={message} tone={message?.includes('submitted') ? 'success' : 'error'} />

      <PortalSection title="My subjects and teachers">
        {data.subjects.length === 0 ? <EmptyNote>Subjects will appear here once teachers are assigned to your class.</EmptyNote> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.subjects.map((s, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <p className="font-display text-lg">{relName(s.subjects)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{relName(s.profiles)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PortalSection>

      <PortalSection title="Assignments">
        {data.assignments.length === 0 ? <EmptyNote>No assignments have been set for your class yet.</EmptyNote> : (
          <div className="space-y-4">
            {data.assignments.map((a) => {
              const sub = data.submissions.find((s) => s.assignment_id === a.id);
              const pastDue = new Date(a.due_at).getTime() <= now;
              return (
                <Card key={a.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{relName(a.subjects)} · due {fmtDate(a.due_at)} · {a.total_marks} marks</p>
                      </div>
                      {sub ? (
                        sub.published ? <Badge>Scored {sub.score}/{a.total_marks}</Badge> : <Badge variant="secondary">Submitted</Badge>
                      ) : pastDue ? <Badge variant="outline">Closed</Badge> : <Badge variant="secondary">Open</Badge>}
                    </div>
                    {a.instructions && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{a.instructions}</p>}
                    {sub?.published && sub.feedback && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Teacher feedback: {sub.feedback}</p>}
                    {!sub && !pastDue && (
                      <div className="mt-4 space-y-3">
                        <Label htmlFor={`sub-${a.id}`}>Your answer</Label>
                        <Textarea id={`sub-${a.id}`} rows={4} value={drafts[a.id] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))} maxLength={10000} />
                        <Button size="sm" disabled={busy || !(drafts[a.id] ?? '').trim()} onClick={() => void run(() => submitFn({ data: { assignment_id: a.id, body: drafts[a.id] ?? '' } }), 'Your work was submitted.')}>Submit work</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PortalSection>

      <PortalSection title="My attendance">
        {data.attendance.length === 0 ? <EmptyNote>No attendance has been recorded for you yet.</EmptyNote> : (
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {data.attendance.map((a) => (
              <li key={a.day} className="flex items-center justify-between rounded-lg border p-3">
                <span>{fmtDate(a.day)}</span>
                <Badge variant={a.present ? 'default' : 'destructive'}>{a.present ? 'Present' : 'Absent'}</Badge>
              </li>
            ))}
          </ul>
        )}
      </PortalSection>

      <PortalSection title="Announcements">
        {data.announcements.length === 0 ? <EmptyNote>No announcements yet.</EmptyNote> : (
          <ul className="space-y-3">
            {data.announcements.map((a) => (
              <li key={a.id} className="rounded-lg border p-4">
                <p className="font-medium">{a.title} <span className="text-sm font-normal text-muted-foreground">· {a.class_id ? relName(a.classes) : 'Whole school'} · {fmtDate(a.created_at)}</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </PortalSection>
      <TimetablePanel />
      <LibraryPanel />
      <ReportCardPanel />
    </PortalShell>
  );
}
