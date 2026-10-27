import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalSection, EmptyNote, FormMessage } from '@/components/portal';
import { useAction } from '@/components/extras-admin';
import { supabase } from '@/integrations/supabase/client';
import {
  getLibrary, createResource, getResourceLink, deleteResource,
  getTimetable, saveTimetableEntry, deleteTimetableEntry,
  getResultsSheet, getResultOverview, saveResults, submitResultSheet, reviewResultSheet, getMyReportCards,
} from '@/lib/extras.functions';

const nameOf = (v: unknown, key = 'name') => (v as Record<string, string> | null)?.[key] ?? '—';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const hhmm = (t: string) => t.slice(0, 5);

export function gradeFor(total: number) {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
}
function currentSession() {
  const d = new Date(); const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}/${y + 1}`;
}

/* ---------- Library ---------- */
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = /\.(pdf|docx?|pptx?|xlsx?|txt|png|jpe?g)$/i;
const KINDS = [['book', 'Book'], ['notes', 'Class notes'], ['past_questions', 'Past questions'], ['other', 'Other']] as const;

export function LibraryPanel() {
  const q = useQuery({ queryKey: ['library'], queryFn: () => getLibrary() });
  const createFn = useServerFn(createResource);
  const linkFn = useServerFn(getResourceLink);
  const deleteFn = useServerFn(deleteResource);
  const { busy, message, tone, run } = useAction(['library']);
  const [form, setForm] = useState({ class_id: '', subject_id: '', title: '', description: '', kind: 'book' as (typeof KINDS)[number][0] });
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  if (q.isLoading) return <PortalSection title="Library and learning resources"><EmptyNote>Loading…</EmptyNote></PortalSection>;
  if (q.error || !q.data) return <PortalSection title="Library and learning resources"><EmptyNote>The library could not be loaded.</EmptyNote></PortalSection>;
  const { resources, classes, subjects } = q.data;
  const canUpload = classes.length > 0;

  async function upload() {
    if (!file) throw new Error('Choose a file first.');
    if (file.size > MAX_BYTES) throw new Error('The file is too large (25 MB maximum).');
    if (!ALLOWED.test(file.name)) throw new Error('Allowed files: PDF, Word, PowerPoint, Excel, text, PNG or JPG.');
    const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-120);
    const path = `${form.class_id}/${crypto.randomUUID()}-${safe}`;
    const up = await supabase.storage.from('resources').upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (up.error) throw new Error('Upload was refused. You can only upload to a class you teach.');
    try {
      await createFn({ data: { class_id: form.class_id, subject_id: form.subject_id || null, title: form.title.trim(), description: form.description, kind: form.kind, file_path: path, file_name: file.name } });
    } catch (e) {
      await supabase.storage.from('resources').remove([path]);
      throw e;
    }
    setFile(null); setFileKey((k) => k + 1); setForm((f) => ({ ...f, title: '', description: '' }));
  }
  async function open(id: string) {
    const { url } = await linkFn({ data: { id } });
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }
  return (
    <PortalSection title="Library and learning resources">
      <FormMessage message={message} tone={tone} />
      {canUpload && (
        <Card className="mb-6">
          <CardContent className="space-y-4 pt-6">
            <p className="font-medium">Upload a resource</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject (optional)</Label>
                <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Any subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as typeof form.kind })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} aria-label="Title" />
            <Textarea rows={2} placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} aria-label="Description" />
            <Input key={fileKey} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="File" />
            <Button disabled={busy || !form.class_id || form.title.trim().length < 2 || !file} onClick={() => void run(upload, 'Resource uploaded.')}>Upload</Button>
          </CardContent>
        </Card>
      )}
      {resources.length === 0 ? <EmptyNote>No books or resources have been shared yet.</EmptyNote> : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <li key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{nameOf(r.classes)}{r.subjects ? ` · ${nameOf(r.subjects)}` : ''}</p>
                </div>
                <Badge variant="secondary">{KINDS.find((k) => k[0] === r.kind)?.[1] ?? r.kind}</Badge>
              </div>
              {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => open(r.id), 'Opening your file…')}>Open / download</Button>
                {canUpload && <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run(() => deleteFn({ data: { id: r.id } }), 'Resource removed.')}>Remove</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalSection>
  );
}

/* ---------- Timetable ---------- */
export function TimetablePanel() {
  const q = useQuery({ queryKey: ['timetable'], queryFn: () => getTimetable() });
  const saveFn = useServerFn(saveTimetableEntry);
  const delFn = useServerFn(deleteTimetableEntry);
  const { busy, message, tone, run } = useAction(['timetable']);
  const [form, setForm] = useState({ class_id: '', subject_id: '', day: '1', start: '08:00', end: '08:40', room: '' });
  const [viewClass, setViewClass] = useState('all');
  if (q.isLoading) return <PortalSection title="Timetable"><EmptyNote>Loading…</EmptyNote></PortalSection>;
  if (q.error || !q.data) return <PortalSection title="Timetable"><EmptyNote>The timetable could not be loaded.</EmptyNote></PortalSection>;
  const { entries, classes, subjects, canEdit } = q.data;
  const classIds = Array.from(new Set(entries.map((e) => e.class_id)));
  const visible = entries.filter((e) => viewClass === 'all' || e.class_id === viewClass);
  return (
    <PortalSection title="Timetable">
      <FormMessage message={message} tone={tone} />
      {canEdit && (
        <Card className="mb-6">
          <CardContent className="space-y-4 pt-6">
            <p className="font-medium">Add a lesson</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                <SelectTrigger aria-label="Class"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                <SelectTrigger aria-label="Subject"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                <SelectTrigger aria-label="Day"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={d} value={String(i + 1)}>{d}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} aria-label="Start time" />
              <Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} aria-label="End time" />
              <Input placeholder="Room (optional)" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} maxLength={60} aria-label="Room" />
            </div>
            <Button disabled={busy || !form.class_id || !form.subject_id || !form.start || !form.end || form.end <= form.start} onClick={() => void run(() => saveFn({ data: { class_id: form.class_id, subject_id: form.subject_id, day: Number(form.day), start_time: form.start, end_time: form.end, room: form.room } }), 'Lesson added.')}>Add lesson</Button>
          </CardContent>
        </Card>
      )}
      {classIds.length > 1 && (
        <div className="mb-4 max-w-xs">
          <Select value={viewClass} onValueChange={setViewClass}>
            <SelectTrigger aria-label="Show class"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.filter((c) => classIds.includes(c.id)).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {visible.length === 0 ? <EmptyNote>No lessons have been scheduled yet.</EmptyNote> : (
        <div className="grid gap-4 md:grid-cols-5">
          {DAYS.map((d, i) => {
            const todays = visible.filter((e) => e.day === i + 1);
            return (
              <div key={d} className="rounded-lg border p-3">
                <p className="font-display text-sm">{d}</p>
                {todays.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No lessons</p> : (
                  <ul className="mt-2 space-y-2">
                    {todays.map((e) => (
                      <li key={e.id} className="rounded-md bg-muted p-2 text-xs">
                        <p className="font-medium">{hhmm(e.start_time)}–{hhmm(e.end_time)}</p>
                        <p>{nameOf(e.subjects)}</p>
                        <p className="text-muted-foreground">{nameOf(e.classes)}{e.room ? ` · ${e.room}` : ''}</p>
                        {canEdit && <button type="button" className="mt-1 text-destructive underline" disabled={busy} onClick={() => void run(() => delFn({ data: { id: e.id } }), 'Lesson removed.')}>Remove</button>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PortalSection>
  );
}

/* ---------- Teacher: enter term results ---------- */
export function ResultsEntryPanel() {
  const overview = useQuery({ queryKey: ['result-overview'], queryFn: () => getResultOverview() });
  const [cls, setCls] = useState('');
  const [term, setTerm] = useState('1');
  const [session, setSession] = useState(currentSession());
  const [subject, setSubject] = useState('');
  const sessionOk = /^[0-9]{4}\/[0-9]{4}$/.test(session);
  const sheet = useQuery({ queryKey: ['result-sheet', cls, term, session], queryFn: () => getResultsSheet({ data: { class_id: cls, term: Number(term), session } }), enabled: !!cls && sessionOk });
  const saveFn = useServerFn(saveResults);
  const submitFn = useServerFn(submitResultSheet);
  const { busy, message, tone, run } = useAction(['result-sheet', 'result-overview']);
  const [edits, setEdits] = useState<Record<string, { ca: string; exam: string; remark: string }>>({});
  const myClasses = (overview.data?.classes ?? []).filter((c) => overview.data?.teachingClassIds.includes(c.id));
  const data = sheet.data;
  const locked = data?.status === 'published';
  const rows = useMemo(() => (data?.roster ?? []).map((r) => {
    const ex = data?.results.find((x) => x.student_id === r.student_id && x.subject_id === subject);
    const e = edits[`${r.student_id}:${subject}`];
    return { id: r.student_id as string, name: nameOf(r.profiles, 'display_name') !== '—' ? nameOf(r.profiles, 'display_name') : nameOf(r.profiles, 'email'), ca: e?.ca ?? String(ex?.ca_score ?? ''), exam: e?.exam ?? String(ex?.exam_score ?? ''), remark: e?.remark ?? (ex?.remark ?? '') };
  }), [data, subject, edits]);
  const setCell = (id: string, patch: Partial<{ ca: string; exam: string; remark: string }>) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setEdits((s) => ({ ...s, [`${id}:${subject}`]: { ca: row.ca, exam: row.exam, remark: row.remark, ...patch } }));
  };
  const invalid = rows.some((r) => (r.ca !== '' && (Number(r.ca) < 0 || Number(r.ca) > 40)) || (r.exam !== '' && (Number(r.exam) < 0 || Number(r.exam) > 60)));
  const save = () => run(async () => {
    const payload = rows.filter((r) => r.ca !== '' || r.exam !== '').map((r) => ({ student_id: r.id, ca_score: Number(r.ca || 0), exam_score: Number(r.exam || 0), remark: r.remark }));
    if (!payload.length) throw new Error('Enter at least one score.');
    await saveFn({ data: { class_id: cls, subject_id: subject, term: Number(term), session, rows: payload } });
    setEdits({});
  }, 'Results saved.');
  return (
    <PortalSection title="Term results">
      <FormMessage message={message} tone={tone} />
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <Select value={cls} onValueChange={(v) => { setCls(v); setSubject(''); setEdits({}); }}>
          <SelectTrigger aria-label="Class"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>{myClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={term} onValueChange={setTerm}>
          <SelectTrigger aria-label="Term"><SelectValue /></SelectTrigger>
          <SelectContent>{['1', '2', '3'].map((t) => <SelectItem key={t} value={t}>Term {t}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={session} onChange={(e) => setSession(e.target.value)} placeholder="2026/2027" aria-label="Session" />
        <Select value={subject} onValueChange={setSubject} disabled={!data}>
          <SelectTrigger aria-label="Subject"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>{(data?.subjects ?? []).map((s) => <SelectItem key={s.subject_id} value={s.subject_id}>{nameOf(s.subjects)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {!cls ? <EmptyNote>Choose a class, term and subject to enter results.</EmptyNote> : !sessionOk ? <EmptyNote>Write the session like 2026/2027.</EmptyNote> : sheet.isLoading ? <EmptyNote>Loading…</EmptyNote> : !data ? <EmptyNote>Could not load this class.</EmptyNote> : (
        <>
          <p className="mb-3 text-sm">Status: <Badge variant={locked ? 'default' : 'secondary'} className="capitalize">{data.status === 'submitted' ? 'Waiting for Principal' : data.status}</Badge></p>
          {!subject ? <EmptyNote>Now choose one of your subjects.</EmptyNote> : rows.length === 0 ? <EmptyNote>No approved students in this class yet.</EmptyNote> : (
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted"><tr><th className="p-2">Student</th><th className="p-2">CA (max 40)</th><th className="p-2">Exam (max 60)</th><th className="p-2">Total</th><th className="p-2">Grade</th><th className="p-2">Remark</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const total = Number(r.ca || 0) + Number(r.exam || 0);
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-2 font-medium">{r.name}</td>
                        <td className="p-2"><Input className="w-20" type="number" min={0} max={40} disabled={locked} value={r.ca} onChange={(e) => setCell(r.id, { ca: e.target.value })} aria-label={`CA for ${r.name}`} /></td>
                        <td className="p-2"><Input className="w-20" type="number" min={0} max={60} disabled={locked} value={r.exam} onChange={(e) => setCell(r.id, { exam: e.target.value })} aria-label={`Exam for ${r.name}`} /></td>
                        <td className="p-2">{r.ca !== '' || r.exam !== '' ? total : '—'}</td>
                        <td className="p-2">{r.ca !== '' || r.exam !== '' ? gradeFor(total) : '—'}</td>
                        <td className="p-2"><Input disabled={locked} value={r.remark} maxLength={200} onChange={(e) => setCell(r.id, { remark: e.target.value })} aria-label={`Remark for ${r.name}`} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!locked && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button disabled={busy || !subject || invalid} onClick={() => void save()}>Save scores</Button>
              <Button variant="outline" disabled={busy} onClick={() => void run(() => submitFn({ data: { class_id: cls, term: Number(term), session } }), 'Sent to the Principal for approval.')}>Send class results to Principal</Button>
            </div>
          )}
          {locked && <p className="mt-3 text-sm text-muted-foreground">These results were published by the Principal and can no longer be edited.</p>}
        </>
      )}
    </PortalSection>
  );
}

/* ---------- Principal: approve and publish ---------- */
export function ResultsReviewPanel() {
  const overview = useQuery({ queryKey: ['result-overview'], queryFn: () => getResultOverview() });
  const reviewFn = useServerFn(reviewResultSheet);
  const { busy, message, tone, run } = useAction(['result-overview', 'result-sheet']);
  const [open, setOpen] = useState<{ class_id: string; term: number; session: string } | null>(null);
  const detail = useQuery({ queryKey: ['result-sheet', open?.class_id, String(open?.term), open?.session], queryFn: () => getResultsSheet({ data: open! }), enabled: !!open });
  const sheets = overview.data?.sheets ?? [];
  const label = { draft: 'Draft', submitted: 'Waiting for approval', published: 'Published' } as const;
  return (
    <PortalSection title="Term results approval">
      <FormMessage message={message} tone={tone} />
      {sheets.length === 0 ? <EmptyNote>No class result sheets have been sent yet.</EmptyNote> : (
        <ul className="space-y-3">
          {sheets.map((s) => (
            <li key={`${s.class_id}${s.term}${s.session}`} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{nameOf(s.classes)} · Term {s.term} · {s.session} <Badge className="ml-2" variant={s.status === 'published' ? 'default' : 'secondary'}>{label[s.status as keyof typeof label] ?? s.status}</Badge></p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOpen(open?.class_id === s.class_id && open.term === s.term && open.session === s.session ? null : { class_id: s.class_id, term: s.term, session: s.session })}>View scores</Button>
                  {s.status === 'submitted' && <Button size="sm" disabled={busy} onClick={() => void run(() => reviewFn({ data: { class_id: s.class_id, term: s.term, session: s.session, publish: true } }), 'Published. Students can now see their report cards.')}>Approve and publish</Button>}
                  {s.status !== 'draft' && <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => reviewFn({ data: { class_id: s.class_id, term: s.term, session: s.session, publish: false } }), 'Sent back to the teachers as a draft.')}>{s.status === 'published' ? 'Unpublish' : 'Send back'}</Button>}
                </div>
              </div>
              {open?.class_id === s.class_id && open.term === s.term && open.session === s.session && (
                <div className="mt-4 overflow-auto">
                  {detail.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !detail.data ? null : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted"><tr><th className="p-2">Student</th>{detail.data.subjects.map((x) => <th key={x.subject_id} className="p-2">{nameOf(x.subjects)}</th>)}<th className="p-2">Average</th></tr></thead>
                      <tbody>
                        {detail.data.roster.map((r) => {
                          const totals = detail.data!.subjects.map((x) => { const f = detail.data!.results.find((y) => y.student_id === r.student_id && y.subject_id === x.subject_id); return f ? Number(f.ca_score) + Number(f.exam_score) : null; });
                          const got = totals.filter((t): t is number => t !== null);
                          return (
                            <tr key={r.student_id} className="border-t">
                              <td className="p-2 font-medium">{nameOf(r.profiles, 'display_name') !== '—' ? nameOf(r.profiles, 'display_name') : nameOf(r.profiles, 'email')}</td>
                              {totals.map((t, i) => <td key={i} className="p-2">{t ?? '—'}</td>)}
                              <td className="p-2">{got.length ? (got.reduce((a, b) => a + b, 0) / got.length).toFixed(1) : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PortalSection>
  );
}

/* ---------- Student: report card ---------- */
export function ReportCardPanel() {
  const q = useQuery({ queryKey: ['my-report-cards'], queryFn: () => getMyReportCards() });
  if (q.isLoading) return <PortalSection title="My report cards"><EmptyNote>Loading…</EmptyNote></PortalSection>;
  const results = q.data?.results ?? [];
  const groups = new Map<string, typeof results>();
  for (const r of results) { const k = `${r.session}|${r.term}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
  return (
    <PortalSection title="My report cards">
      {groups.size === 0 ? <EmptyNote>Your results will appear here once the Principal publishes them.</EmptyNote> : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([k, rows]) => {
            const [session, term] = k.split('|');
            const totals = rows.map((r) => Number(r.ca_score) + Number(r.exam_score));
            const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
            return (
              <Card key={k} className="print:shadow-none">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg">Term {term} · {session}</p>
                      <p className="text-sm text-muted-foreground">{q.data?.student} · {nameOf(rows[0].classes)}</p>
                    </div>
                    <Button size="sm" variant="outline" className="print:hidden" onClick={() => window.print()}>Print</Button>
                  </div>
                  <table className="mt-4 w-full text-left text-sm">
                    <thead className="bg-muted"><tr><th className="p-2">Subject</th><th className="p-2">CA</th><th className="p-2">Exam</th><th className="p-2">Total</th><th className="p-2">Grade</th><th className="p-2">Remark</th></tr></thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-medium">{nameOf(r.subjects)}</td><td className="p-2">{r.ca_score}</td><td className="p-2">{r.exam_score}</td>
                          <td className="p-2">{totals[i]}</td><td className="p-2">{gradeFor(totals[i])}</td><td className="p-2 text-muted-foreground">{r.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-sm font-medium">Average: {avg.toFixed(1)} · Overall grade {gradeFor(avg)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PortalSection>
  );
}
