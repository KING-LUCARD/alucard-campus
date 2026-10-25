import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import img from '@/assets/students.jpg';
import { PageHero, SectionTitle } from '@/components/site/PageHero';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/site/Field';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { submitApplication } from '@/lib/school.functions';
import { applicationSchema } from '@/lib/school-validation';
import { departments, schoolClasses } from '@/lib/site';
import { pageHead } from '@/lib/metadata';

export const Route = createFileRoute('/admissions')({
  head: () => pageHead('Admissions', 'How to apply to ALUCARD INSTITUTE: JSS1–SS3 classes, requirements, documents and online application.'),
  component: Admissions,
});

const steps = ['Create an account and sign in', 'Complete the online application', 'Submit required documents', 'Entrance assessment and interview', 'Receive admission decision'];
const documents = ['Birth certificate or passport data page', 'Most recent school report', 'Two passport photographs', 'Transfer letter (if applicable)', 'Medical information form'];
// Classes map to the stored entry-year values used by the application records.
const entryOptions = schoolClasses.map((c, i) => ({ label: c, value: `Year ${i + 7}` }));
const faqs = [
  { q: 'Which classes can I apply for?', a: `Applications are accepted for ${schoolClasses.join(', ')}, subject to available places.` },
  { q: 'When do senior students choose a pathway?', a: `From SS1, students choose ${departments.map((d) => d.name).join(', ')}. Mathematics and English remain core.` },
  { q: 'What are the fees and deadlines?', a: 'Fees and deadlines will be published once confirmed by the school. Contact the admissions office for current information.' },
  { q: 'How do I check my application status?', a: 'Sign in and open My account to see the status of every application you submitted.' },
];

function Admissions() {
  const { user } = useSchoolAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    const form = e.currentTarget;
    try {
      const data = applicationSchema.parse(Object.fromEntries(new FormData(form)));
      await submitApplication({ data });
      form.reset(); setMsg('Application received. You can track its status in My account.');
    } catch (x) { setErr(x instanceof Error && x.name !== 'ZodError' ? x.message : 'Please check every field and try again.'); }
    finally { setBusy(false); }
  }
  return <>
    <PageHero eyebrow="Admissions" title="Begin your journey" intro="Applications for JSS1–JSS3 and SS1–SS3. Fees, deadlines and requirements will be confirmed by the school." image={img} />
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionTitle eyebrow="Step by step" title="How to apply" />
      <Stagger className="mt-12 grid gap-4 md:grid-cols-5">{steps.map((s, i) => <StaggerItem key={s} className="rounded-lg border border-border bg-card p-6"><span className="font-display text-4xl text-gold">0{i + 1}</span><p className="mt-3 font-semibold">{s}</p></StaggerItem>)}</Stagger>
      <div className="mt-16 grid gap-10 md:grid-cols-3">
        <Reveal><h2 className="text-2xl">Available classes</h2><p className="mt-3 text-muted-foreground">{schoolClasses.join(' · ')}</p><p className="mt-3 text-sm text-muted-foreground">Senior pathways: {departments.map((d) => d.name).join(', ')}.</p></Reveal>
        <Reveal><h2 className="text-2xl">Entry requirements</h2><p className="mt-3 text-muted-foreground">A satisfactory recent school report, an entrance assessment in Mathematics and English, and an interview with the student and guardian. Final requirements to be confirmed.</p></Reveal>
        <Reveal><h2 className="text-2xl">Required documents</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">{documents.map((d) => <li key={d}>{d}</li>)}</ul></Reveal>
      </div>
    </section>
    <section id="apply" className="bg-secondary py-24"><div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
      <div><SectionTitle eyebrow="Apply now" title="Online application" intro="Applications are saved securely to your school account." />
        {!user ? <div className="mt-8"><p className="text-muted-foreground">Please sign in or create an account to apply.</p><Button asChild className="mt-4"><Link to="/auth" search={{ mode: 'register' }}>Sign up to apply</Link></Button></div> :
        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-lg border border-border bg-card p-6">
          <Field label="Student full name"><Input name="student_name" required maxLength={100} /></Field>
          <Field label="Parent or guardian name"><Input name="guardian_name" required maxLength={100} /></Field>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Phone"><Input name="phone" type="tel" required maxLength={30} /></Field>
          <Field label="Class applying for"><select name="entry_year" className="h-10 rounded-md border border-input bg-background px-3">{entryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Field label="Notes (optional)"><textarea name="notes" maxLength={2000} className="min-h-24 rounded-md border border-input bg-background p-3" /></Field>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}{msg && <p role="status" className="text-sm text-primary">{msg}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</Button>
        </form>}
      </div>
      <div><SectionTitle eyebrow="Questions" title="Frequently asked" />
        <Accordion type="single" collapsible className="mt-8">{faqs.map((f) => <AccordionItem key={f.q} value={f.q}><AccordionTrigger>{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>)}</Accordion>
      </div>
    </div></section>
  </>;
}
