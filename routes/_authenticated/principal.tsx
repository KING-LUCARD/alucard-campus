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
import { PortalShell, PortalSection, StatCards, EmptyNote, PortalDenied, FormMessage } from '@/components/portal';
import { getPrincipalPortal, postAnnouncement } from '@/lib/portal.functions';
import { ResultsReviewPanel, TimetablePanel, LibraryPanel } from '@/components/extras-school';
import { pageHead } from '@/lib/metadata';

const principalQuery = queryOptions({ queryKey: ['principal-portal'], queryFn: () => getPrincipalPortal() });

export const Route = createFileRoute('/_authenticated/principal')({
  head: () => pageHead('Principal portal', 'Alucard Institute principal dashboard: school-wide oversight of students, staff, attendance and results.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(principalQuery),
  errorComponent: () => <PortalDenied area="the principal" />,
  notFoundComponent: () => <p className="px-6 pb-24 pt-40">Not found.</p>,
  component: PrincipalPortal,
});

const relName = (v: unknown) => (v as { name?: string } | null)?.name ?? '—';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function PrincipalPortal() {
  const { data } = useSuspenseQuery(principalQuery);
  const queryClient = useQueryClient();
  const announceFn = useServerFn(postAnnouncement);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const activeRoles = data.roles.filter((r) => r.active);
  const studentCount = activeRoles.filter((r) => r.role === 'student').length;
  const teacherCount = activeRoles.filter((r) => r.role === 'teacher').length;
  const presentCount = data.attendance.filter((a) => a.present).length;
  const attendanceRate = data.attendance.length ? Math.round((presentCount / data.attendance.length) * 100) : null;
  const awaitingPublication = data.submissions.filter((s) => s.score !== null && !s.published);
  const assignmentById = new Map(data.assignments.map((a) => [a.id, a]));
  const enrollmentByClass = new Map<string, number>();
  for (const e of data.enrollments.filter((e) => e.status === 'approved')) {
    enrollmentByClass.set(e.class_id, (enrollmentByClass.get(e.class_id) ?? 0) + 1);
  }

  async function postNotice() {
    setBusy(true);
    setMessage(null);
    try {
      await announceFn({ data: { title: noticeTitle, body: noticeBody, class_id: null } });
      setNoticeTitle('');
      setNoticeBody('');
      setMessage('Announcement posted.');
      await queryClient.invalidateQueries({ queryKey: ['principal-portal'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'The announcement could not be posted.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalShell eyebrow="Alucard Institute" title="Principal portal" blurb="School-wide oversight: enrollment, staffing, attendance, results and announcements.">
      <StatCards stats={[
        { label: 'Students', value: studentCount },
        { label: 'Teachers', value: teacherCount },
        { label: 'Attendance rate', value: attendanceRate === null ? '—' : `${attendanceRate}%`, hint: 'Recent records' },
        { label: 'Grades awaiting publication', value: awaitingPublication.length },
      ]} />
      <FormMessage message={message} tone={message?.includes('posted') ? 'success' : 'error'} />

      <PortalSection title="Enrollment by class">
        {data.classes.length === 0 ? <EmptyNote>No classes configured.</EmptyNote> : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.classes.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border p-4">
                <span className="font-medium">{c.name}</span>
                <Badge variant="secondary">{enrollmentByClass.get(c.id) ?? 0} students</Badge>
              </li>
            ))}
          </ul>
        )}
      </PortalSection>

      <PortalSection title="Teaching assignments">
        {data.teaching.length === 0 ? <EmptyNote>No teaching assignments yet. The administrator assigns teachers to classes and subjects.</EmptyNote> : (
          <ul className="space-y-2 text-sm">
            {data.teaching.map((t) => (
              <li key={t.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3">
                <span>{relName(t.classes)} · {relName(t.subjects)}</span>
                <span className="text-muted-foreground">{relName(t.profiles)}</span>
              </li>
            ))}
          </ul>
        )}
      </PortalSection>

      <PortalSection title="Grades awaiting publication">
        {awaitingPublication.length === 0 ? <EmptyNote>No graded work is waiting to be published.</EmptyNote> : (
          <ul className="space-y-2 text-sm">
            {awaitingPublication.map((s) => {
              const a = assignmentById.get(s.assignment_id);
              return (
                <li key={s.id} className="flex flex-wrap justify-between gap-2 rounded-lg border p-3">
                  <span>{a?.title ?? 'Assignment'} <span className="text-muted-foreground">· {a ? relName(a.classes) : ''} · {a ? relName(a.subjects) : ''}</span></span>
                  <span className="text-muted-foreground">graded {fmtDate(s.submitted_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Teachers publish grades from their own portal after grading; this list shows what is still unpublished.</p>
      </PortalSection>

      <PortalSection title="School announcement">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label htmlFor="pn-title">Title</Label>
              <Input id="pn-title" className="mt-2" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} maxLength={140} />
            </div>
            <div>
              <Label htmlFor="pn-body">Message</Label>
              <Textarea id="pn-body" className="mt-2" rows={4} value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} maxLength={4000} />
            </div>
            <Button disabled={busy || noticeTitle.trim().length < 3 || noticeBody.trim().length < 3} onClick={() => void postNotice()}>Post to whole school</Button>
          </CardContent>
        </Card>
        {data.announcements.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {data.announcements.map((a) => <li key={a.id} className="rounded-lg border p-3"><span className="font-medium">{a.title}</span> <span className="text-muted-foreground">· {a.class_id ? relName(a.classes) : 'Whole school'} · {fmtDate(a.created_at)}</span></li>)}
          </ul>
        )}
      </PortalSection>
      <ResultsReviewPanel />
      <TimetablePanel />
      <LibraryPanel />
    </PortalShell>
  );
}
