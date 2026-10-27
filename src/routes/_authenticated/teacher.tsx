import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalShell, PortalSection, StatCards, EmptyNote, PortalDenied, FormMessage } from '@/components/portal';
import { getTeacherPortal, getClassRoster, createAssignment, gradeSubmission, takeAttendance, postAnnouncement } from '@/lib/portal.functions';
import { pageHead } from '@/lib/metadata';

const teacherQuery = queryOptions({ queryKey: ['teacher-portal'], queryFn: () => getTeacherPortal() });

export const Route = createFileRoute('/_authenticated/teacher')({
  head: () => pageHead('Teacher portal', 'Alucard Institute teacher dashboard: classes, attendance, assignments and grading.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(teacherQuery),
  errorComponent: () => <PortalDenied area="teachers" />,
  notFoundComponent: () => <p className="px-6 pb-24 pt-40">Not found.</p>,
  component: TeacherPortal,
});

const relName = (v: unknown) => (v as { name?: string } | null)?.name ?? '—';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
type RosterRow = { student_id: string; department: string | null; profiles: { display_name?: string; email?: string } | null };

function TeacherPortal() {
  const { data } = useSuspenseQuery(teacherQuery);
  const queryClient = useQueryClient();
  const rosterFn = useServerFn(getClassRoster);
  const createFn = useServerFn(createAssignment);
  const gradeFn = useServerFn(gradeSubmission);
  const attendanceFn = useServerFn(takeAttendance);
  const announceFn = useServerFn(postAnnouncement);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterClass, setRosterClass] = useState('');
  const [attDay, setAttDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [marks, setMarks] = useState('100');
  const [assignTarget, setAssignTarget] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeClass, setNoticeClass] = useState('');
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});

  const myClasses = [...new Map(data.teaching.map((t) => [t.class_id, relName(t.classes)])).entries()];
  const toGrade = data.submissions.filter((s) => s.score === null);

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(ok);
      await queryClient.invalidateQueries({ queryKey: ['teacher-portal'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'The action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function loadRoster(classId: string) {
    setRosterClass(classId);
    const rows = await rosterFn({ data: { class_id: classId } });
    setRoster(rows as RosterRow[]);
    setPresent(Object.fromEntries((rows as RosterRow[]).map((r) => [r.student_id, true])));
  }

  return (
    <PortalShell eyebrow="Alucard Institute" title="Teacher portal" blurb="Your classes, attendance, assignments and grading — all in one place.">
      <StatCards stats={[
        { label: 'Classes you teach', value: myClasses.length },
        { label: 'Teaching assignments', value: data.teaching.length },
        { label: 'Assignments set', value: data.assignments.length },
        { label: 'Submissions to grade', value: toGrade.length },
      ]} />
      <FormMessage message={message} tone={message?.includes('saved') || message?.includes('posted') ? 'success' : 'error'} />

      <PortalSection title="My classes and subjects">
        {data.teaching.length === 0 ? <EmptyNote>You have not been assigned to any class yet. The school office assigns teachers to classes and subjects.</EmptyNote> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.teaching.map((t) => (
              <Card key={t.id}>
                <CardContent className="pt-6">
                  <p className="font-display text-xl">{relName(t.classes)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{relName(t.subjects)}</p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => void loadRoster(t.class_id)}>View roster</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {rosterClass && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="font-medium">Roster — {relName(myClasses.find(([id]) => id === rosterClass)?.[1] ? { name: myClasses.find(([id]) => id === rosterClass)?.[1] } : null)}</p>
              {roster.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No approved students in this class yet.</p> : (
                <ul className="mt-3 space-y-1 text-sm">
                  {roster.map((r) => <li key={r.student_id}>{r.profiles?.display_name || r.profiles?.email || 'Student'}{r.department ? ` · ${r.department}` : ''}</li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </PortalSection>

      <PortalSection title="Take attendance">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Class</Label>
                <Select value={rosterClass} onValueChange={(v) => void loadRoster(v)}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{myClasses.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="att-day">Date</Label>
                <Input id="att-day" type="date" className="mt-2" value={attDay} onChange={(e) => setAttDay(e.target.value)} />
              </div>
            </div>
            {roster.length > 0 && (
              <>
                <ul className="divide-y rounded-lg border">
                  {roster.map((r) => (
                    <li key={r.student_id} className="flex items-center justify-between gap-4 p-3 text-sm">
                      <span>{r.profiles?.display_name || r.profiles?.email || 'Student'}</span>
                      <label className="flex items-center gap-2">
                        <span className="text-muted-foreground">Present</span>
                        <Checkbox checked={present[r.student_id] ?? true} onCheckedChange={(v) => setPresent((p) => ({ ...p, [r.student_id]: v === true }))} />
                      </label>
                    </li>
                  ))}
                </ul>
                <Button disabled={busy} onClick={() => void run(() => attendanceFn({ data: { class_id: rosterClass, day: attDay, records: roster.map((r) => ({ student_id: r.student_id, present: present[r.student_id] ?? true })) } }), 'Attendance saved.')}>Save attendance</Button>
              </>
            )}
          </CardContent>
        </Card>
      </PortalSection>

      <PortalSection title="Set an assignment">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Class and subject</Label>
                <Select value={assignTarget} onValueChange={setAssignTarget}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choose" /></SelectTrigger>
                  <SelectContent>{data.teaching.map((t) => <SelectItem key={t.id} value={`${t.class_id}|${t.subject_id}`}>{relName(t.classes)} · {relName(t.subjects)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="as-title">Title</Label>
                <Input id="as-title" className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label htmlFor="as-due">Due date</Label>
                <Input id="as-due" type="datetime-local" className="mt-2" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="as-marks">Total marks</Label>
                <Input id="as-marks" type="number" min={1} max={1000} className="mt-2" value={marks} onChange={(e) => setMarks(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="as-instructions">Instructions</Label>
              <Textarea id="as-instructions" className="mt-2" rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={4000} />
            </div>
            <Button disabled={busy || !assignTarget || title.trim().length < 3 || !dueAt} onClick={() => {
              const [class_id, subject_id] = assignTarget.split('|');
              void run(async () => {
                await createFn({ data: { class_id, subject_id, title, instructions, due_at: new Date(dueAt).toISOString(), total_marks: Number(marks) || 100 } });
                setTitle(''); setInstructions(''); setDueAt('');
              }, 'Assignment saved.');
            }}>Publish assignment</Button>
          </CardContent>
        </Card>
      </PortalSection>

      <PortalSection title="Assignments and grading">
        {data.assignments.length === 0 ? <EmptyNote>No assignments yet.</EmptyNote> : (
          <div className="space-y-6">
            {data.assignments.map((a) => {
              const subs = data.submissions.filter((s) => s.assignment_id === a.id);
              return (
                <Card key={a.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{relName(a.classes)} · {relName(a.subjects)} · due {fmtDate(a.due_at)} · {a.total_marks} marks</p>
                      </div>
                      <Badge variant="secondary">{subs.length} submission{subs.length === 1 ? '' : 's'}</Badge>
                    </div>
                    {subs.length > 0 && (
                      <ul className="mt-4 space-y-4">
                        {subs.map((s) => {
                          const g = grades[s.id] ?? { score: s.score?.toString() ?? '', feedback: s.feedback };
                          return (
                            <li key={s.id} className="rounded-lg border p-4">
                              <p className="text-sm font-medium">{(s.profiles as { display_name?: string } | null)?.display_name || 'Student'} <span className="text-muted-foreground">· submitted {fmtDate(s.submitted_at)}</span></p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{s.body}</p>
                              <div className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
                                <div>
                                  <Label>Score / {a.total_marks}</Label>
                                  <Input type="number" min={0} max={a.total_marks} className="mt-1" value={g.score} onChange={(e) => setGrades((prev) => ({ ...prev, [s.id]: { ...g, score: e.target.value } }))} />
                                </div>
                                <div>
                                  <Label>Feedback</Label>
                                  <Input className="mt-1" value={g.feedback} onChange={(e) => setGrades((prev) => ({ ...prev, [s.id]: { ...g, feedback: e.target.value } }))} maxLength={2000} />
                                </div>
                                <div className="flex items-end gap-2">
                                  <Button size="sm" variant="outline" disabled={busy || g.score === ''} onClick={() => void run(() => gradeFn({ data: { id: s.id, score: Number(g.score), feedback: g.feedback, published: false } }), 'Grade saved.')}>Save</Button>
                                  <Button size="sm" disabled={busy || g.score === ''} onClick={() => void run(() => gradeFn({ data: { id: s.id, score: Number(g.score), feedback: g.feedback, published: true } }), 'Grade saved and published.')}>{s.published ? 'Published' : 'Publish'}</Button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PortalSection>

      <PortalSection title="Class announcement">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Class</Label>
                <Select value={noticeClass} onValueChange={setNoticeClass}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{myClasses.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tc-title">Title</Label>
                <Input id="tc-title" className="mt-2" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} maxLength={140} />
              </div>
            </div>
            <div>
              <Label htmlFor="tc-body">Message</Label>
              <Textarea id="tc-body" className="mt-2" rows={3} value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} maxLength={4000} />
            </div>
            <Button disabled={busy || !noticeClass || noticeTitle.trim().length < 3 || noticeBody.trim().length < 3} onClick={() => void run(async () => { await announceFn({ data: { title: noticeTitle, body: noticeBody, class_id: noticeClass } }); setNoticeTitle(''); setNoticeBody(''); }, 'Announcement posted.')}>Post to class</Button>
          </CardContent>
        </Card>
        {data.announcements.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {data.announcements.map((a) => <li key={a.id} className="rounded-lg border p-3"><span className="font-medium">{a.title}</span> <span className="text-muted-foreground">· {a.class_id ? relName(a.classes) : 'Whole school'} · {fmtDate(a.created_at)}</span></li>)}
          </ul>
        )}
      </PortalSection>
    </PortalShell>
  );
}
