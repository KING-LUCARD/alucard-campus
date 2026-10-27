import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PortalSection, EmptyNote, FormMessage } from '@/components/portal';
import {
  getAdmissionsAdmin, reviewApplication, convertApplicant,
  getAdminAssignments, adminUpdateAssignment, adminDeleteAssignment, adminCorrectGrade,
  getAuditLog, getExportData,
} from '@/lib/extras.functions';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const nameOf = (v: unknown, key = 'name') => (v as Record<string, string> | null)?.[key] ?? '—';

export function useAction(invalidate: string[]) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true); setMessage(null);
    try {
      await action(); setOk(true); setMessage(done);
      await Promise.all(invalidate.map((k) => qc.invalidateQueries({ queryKey: [k] })));
    } catch (e) { setOk(false); setMessage(e instanceof Error ? e.message : 'The action failed.'); } finally { setBusy(false); }
  }
  return { busy, message, tone: (ok ? 'success' : 'error') as 'success' | 'error', run };
}

/* ---------- CSV ---------- */
function csvCell(v: unknown) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
}
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return false;
  const cols = Object.keys(rows[0]);
  const text = [cols.map(csvCell).join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/* ---------- Admissions ---------- */
const statusTone: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { submitted: 'secondary', reviewing: 'outline', accepted: 'default', declined: 'destructive' };

export function AdmissionsPanel() {
  const q = useQuery({ queryKey: ['admin-admissions'], queryFn: () => getAdmissionsAdmin() });
  const reviewFn = useServerFn(reviewApplication);
  const convertFn = useServerFn(convertApplicant);
  const { busy, message, tone, run } = useAction(['admin-admissions', 'admin-portal']);
  const [place, setPlace] = useState<Record<string, { cls: string; dept: string }>>({});
  const [filter, setFilter] = useState('all');
  if (q.isLoading) return <PortalSection title="Admission applications"><EmptyNote>Loading…</EmptyNote></PortalSection>;
  if (q.error || !q.data) return <PortalSection title="Admission applications"><EmptyNote>Applications could not be loaded.</EmptyNote></PortalSection>;
  const { applications, classes } = q.data;
  const shown = applications.filter((a) => filter === 'all' || a.status === filter);
  return (
    <PortalSection title="Admission applications">
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'submitted', 'reviewing', 'accepted', 'declined'].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>
      <FormMessage message={message} tone={tone} />
      {shown.length === 0 ? <EmptyNote>No applications here yet.</EmptyNote> : (
        <div className="space-y-4">
          {shown.map((a) => {
            const p = place[a.id] ?? { cls: '', dept: '' };
            const cls = classes.find((c) => c.id === p.cls);
            return (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{a.student_name} <span className="text-sm font-normal text-muted-foreground">· applying for {a.entry_year}</span></p>
                      <p className="text-sm text-muted-foreground">Guardian: {a.guardian_name} · {a.phone} · {a.email} · {fmt(a.created_at)}</p>
                      {a.notes && <p className="mt-2 text-sm">{a.notes}</p>}
                    </div>
                    <Badge variant={statusTone[a.status] ?? 'secondary'} className="capitalize">{a.status}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busy || a.status === 'reviewing'} onClick={() => void run(() => reviewFn({ data: { application_id: a.id, status: 'reviewing' } }), 'Marked as under review.')}>Under review</Button>
                    <Button size="sm" disabled={busy || a.status === 'accepted'} onClick={() => void run(() => reviewFn({ data: { application_id: a.id, status: 'accepted' } }), 'Application accepted.')}>Accept</Button>
                    <Button size="sm" variant="destructive" disabled={busy || a.status === 'declined'} onClick={() => void run(() => reviewFn({ data: { application_id: a.id, status: 'declined' } }), 'Application declined.')}>Decline</Button>
                  </div>
                  {a.status === 'accepted' && (
                    <div className="mt-4 grid gap-3 rounded-lg bg-muted p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <div>
                        <Label>Class</Label>
                        <Select value={p.cls} onValueChange={(v) => setPlace((s) => ({ ...s, [a.id]: { cls: v, dept: '' } }))}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder="Choose class" /></SelectTrigger>
                          <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <Select value={p.dept} disabled={!cls?.senior} onValueChange={(v) => setPlace((s) => ({ ...s, [a.id]: { ...p, dept: v } }))}>
                          <SelectTrigger className="mt-2"><SelectValue placeholder={cls?.senior ? 'Choose department' : 'Not needed'} /></SelectTrigger>
                          <SelectContent>{['Science', 'Commercial', 'Arts'].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button disabled={busy || !p.cls || (cls?.senior === true && !p.dept)} onClick={() => void run(() => convertFn({ data: { application_id: a.id, class_id: p.cls, department: cls?.senior ? (p.dept as 'Science' | 'Commercial' | 'Arts') : null } }), `${a.student_name} is now a student in ${cls?.name}.`)}>Make student</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PortalSection>
  );
}

/* ---------- Assignments and grade corrections ---------- */
export function AssignmentsPanel() {
  const q = useQuery({ queryKey: ['admin-assignments'], queryFn: () => getAdminAssignments() });
  const updateFn = useServerFn(adminUpdateAssignment);
  const deleteFn = useServerFn(adminDeleteAssignment);
  const gradeFn = useServerFn(adminCorrectGrade);
  const { busy, message, tone, run } = useAction(['admin-assignments', 'admin-audit']);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', instructions: '', due: '', marks: '100' });
  const [grading, setGrading] = useState<Record<string, { score: string; feedback: string }>>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  if (q.isLoading) return <PortalSection title="Assignments and grade corrections"><EmptyNote>Loading…</EmptyNote></PortalSection>;
  if (q.error || !q.data) return <PortalSection title="Assignments and grade corrections"><EmptyNote>Assignments could not be loaded.</EmptyNote></PortalSection>;
  const { assignments, submissions } = q.data;
  const toLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  return (
    <PortalSection title="Assignments and grade corrections">
      <FormMessage message={message} tone={tone} />
      {assignments.length === 0 ? <EmptyNote>No assignments yet.</EmptyNote> : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const subs = submissions.filter((s) => s.assignment_id === a.id);
            return (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  {editing === a.id ? (
                    <div className="space-y-3">
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} aria-label="Title" />
                      <Textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} maxLength={5000} aria-label="Instructions" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input type="datetime-local" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} aria-label="Deadline" />
                        <Input type="number" min={1} max={1000} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} aria-label="Total marks" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy || form.title.trim().length < 3 || !form.due} onClick={() => void run(async () => { await updateFn({ data: { id: a.id, title: form.title.trim(), instructions: form.instructions, due_at: new Date(form.due).toISOString(), total_marks: Number(form.marks) } }); setEditing(null); }, 'Assignment updated.')}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-sm text-muted-foreground">{nameOf(a.classes)} · {nameOf(a.subjects)} · {nameOf(a.profiles, 'display_name')} · due {fmt(a.due_at)} · {a.total_marks} marks</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditing(a.id); setForm({ title: a.title, instructions: a.instructions, due: toLocal(a.due_at), marks: String(a.total_marks) }); }}>Edit</Button>
                        {confirmDel === a.id ? (
                          <>
                            <Button size="sm" variant="destructive" disabled={busy} onClick={() => void run(async () => { await deleteFn({ data: { id: a.id } }); setConfirmDel(null); }, 'Assignment deleted.')}>Yes, delete (removes submissions)</Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDel(null)}>Keep</Button>
                          </>
                        ) : <Button size="sm" variant="destructive" onClick={() => setConfirmDel(a.id)}>Delete</Button>}
                      </div>
                    </div>
                  )}
                  {subs.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t pt-4 text-sm">
                      {subs.map((s) => {
                        const g = grading[s.id] ?? { score: String(s.score ?? ''), feedback: s.feedback ?? '' };
                        return (
                          <li key={s.id} className="flex flex-wrap items-center gap-2">
                            <span className="min-w-40 font-medium">{nameOf(s.profiles, 'display_name') !== '—' ? nameOf(s.profiles, 'display_name') : nameOf(s.profiles, 'email')}</span>
                            <Input className="w-20" type="number" min={0} max={a.total_marks} value={g.score} onChange={(e) => setGrading((x) => ({ ...x, [s.id]: { ...g, score: e.target.value } }))} aria-label="Score" />
                            <span className="text-muted-foreground">/ {a.total_marks}</span>
                            <Input className="min-w-48 flex-1" value={g.feedback} onChange={(e) => setGrading((x) => ({ ...x, [s.id]: { ...g, feedback: e.target.value } }))} placeholder="Feedback" maxLength={2000} aria-label="Feedback" />
                            <Button size="sm" variant="outline" disabled={busy || g.score === '' || Number(g.score) < 0 || Number(g.score) > a.total_marks} onClick={() => void run(() => gradeFn({ data: { submission_id: s.id, score: Number(g.score), feedback: g.feedback } }), 'Grade corrected (logged).')}>Correct grade</Button>
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
  );
}

/* ---------- Audit log and exports ---------- */
export function AuditPanel() {
  const q = useQuery({ queryKey: ['admin-audit'], queryFn: () => getAuditLog() });
  const exportFn = useServerFn(getExportData);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function exportKind(kind: 'students' | 'applications' | 'grades') {
    setBusy(true); setNote(null);
    try {
      const rows = await exportFn({ data: { kind } });
      setNote(downloadCsv(`alucard-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, rows as Record<string, unknown>[]) ? 'Download started.' : 'Nothing to export yet.');
    } catch (e) { setNote(e instanceof Error ? e.message : 'Export failed.'); } finally { setBusy(false); }
  }
  const rows = (q.data ?? []).filter((r) => !search || `${r.action} ${r.actor} ${r.target}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <PortalSection title="Audit log and exports">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportKind('students')}>Export students (CSV)</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportKind('applications')}>Export applications (CSV)</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportKind('grades')}>Export term results (CSV)</Button>
        <Button size="sm" variant="outline" disabled={!rows.length} onClick={() => downloadCsv(`alucard-audit-${new Date().toISOString().slice(0, 10)}.csv`, rows.map((r) => ({ When: r.created_at, Who: r.actor, Action: r.action, About: r.target })))}>Export audit log (CSV)</Button>
      </div>
      <FormMessage message={note} tone="success" />
      <Input className="mb-4 max-w-sm" placeholder="Search the log…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search the audit log" />
      {q.isLoading ? <EmptyNote>Loading…</EmptyNote> : rows.length === 0 ? <EmptyNote>No log entries match.</EmptyNote> : (
        <div className="max-h-96 overflow-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted"><tr><th className="p-2">When</th><th className="p-2">Who</th><th className="p-2">Action</th><th className="p-2">About</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="whitespace-nowrap p-2 text-muted-foreground">{new Date(r.created_at).toLocaleString('en-GB')}</td>
                  <td className="p-2">{r.actor}</td>
                  <td className="p-2 font-medium">{r.action.replace(/_/g, ' ')}</td>
                  <td className="p-2 text-muted-foreground">{r.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PortalSection>
  );
}
