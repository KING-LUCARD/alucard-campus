import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { MapPin, Phone, Mail } from 'lucide-react';
import img from "@/assets/hero.jpg";
import { PageHero } from "@/components/site/PageHero";
import { school } from '@/lib/site';
import { pageHead } from '@/lib/metadata';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/site/Field';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { submitContact } from '@/lib/school.functions';
import { contactSchema } from '@/lib/school-validation';

export const Route = createFileRoute("/contact")({
  head: () => pageHead('Contact us in Lekki', 'Contact ALUCARD INSTITUTE in Lekki by phone, email or a secure message.'),
  component: Contact,
});

function Contact() {
  const { user } = useSchoolAuth();
  const sendMessage = useServerFn(submitContact);
  const mutation = useMutation({ mutationFn: sendMessage });
  const [validationError, setValidationError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError('');
    const parsed = contactSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) { setValidationError('Enter your name, a valid email, a subject and a message of at least 10 characters.'); return; }
    try { await mutation.mutateAsync({ data: parsed.data }); } catch { /* Mutation displays the error. */ }
  }
  return <>
    <PageHero eyebrow="ALUCARD INSTITUTE · LEKKI" title="Let’s start a conversation" intro="Questions about admissions, academics or school life? Get in touch." image={img} />
    <section className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2">
      <Reveal><h2 className="text-3xl">Contact the school</h2><dl className="mt-10 space-y-8">
        <div className="flex gap-4"><MapPin className="h-6 w-6 shrink-0 text-primary"/><div><dt className="font-semibold">Location</dt><dd className="mt-2 text-muted-foreground">{school.address}</dd></div></div>
        <div className="flex gap-4"><Phone className="h-6 w-6 shrink-0 text-primary"/><div><dt className="font-semibold">Call</dt><dd className="mt-2"><a className="text-muted-foreground hover:text-primary" href={`tel:${school.phone}`}>{school.phone}</a></dd></div></div>
        <div className="flex gap-4"><Mail className="h-6 w-6 shrink-0 text-primary"/><div className="min-w-0"><dt className="font-semibold">Email</dt><dd className="mt-2 break-words"><a className="text-muted-foreground hover:text-primary" href={`mailto:${school.email}`}>{school.email}</a></dd></div></div>
      </dl><p className="mt-10 text-sm text-muted-foreground">Exact campus address and office hours to be confirmed.</p></Reveal>
      <Reveal variant="slideRight"><h2 className="text-3xl">Send a message</h2>{!user ? <div className="mt-6"><p className="text-muted-foreground">Sign in to send a private school message, or contact us by phone or email.</p><Button asChild className="mt-6"><Link to="/auth">Log In</Link></Button></div> : mutation.isSuccess ? <p role="status" className="mt-6 text-primary">Your message has been saved for the school team.</p> : <form onSubmit={submit} className="mt-8 grid gap-5"><Field label="Full name"><Input name="name" required maxLength={100}/></Field><Field label="Email address"><Input name="email" type="email" defaultValue={user.email} required/></Field><Field label="Subject"><Input name="subject" required maxLength={150}/></Field><Field label="Message"><textarea name="message" className="min-h-36 rounded-md border border-input bg-background p-3 font-normal" required minLength={10} maxLength={4000}/></Field>{validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}{mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Sending…' : 'Send message'}</Button></form>}</Reveal>
    </section>
  </>;
}
