import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/site/Field';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { pageHead } from '@/lib/metadata';
import { registrationSchema } from '@/lib/school-validation';
import campus from '@/assets/library.jpg';

export const Route = createFileRoute('/auth')({ validateSearch: z.object({ mode: z.enum(['register', 'signin']).optional().catch(undefined) }), head: () => pageHead('School sign-in', 'Secure access to your Alucard Institute school account.'), component: Auth });
function Auth() {
  const { user } = useSchoolAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode,setMode] = useState<'signin'|'register'|'forgot'>(search.mode === 'register' ? 'register' : 'signin');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if(mode==='register') {
        const values=registrationSchema.parse(data);
        const {error}=await supabase.auth.signUp({email:values.email,password:values.password,options:{emailRedirectTo:window.location.origin,data:{display_name:values.display_name,requested_role:values.requested_role}}});
        if(error) throw error;
        setNotice('Check your email to confirm your account. Your school access request will remain pending until approved.');
      } else if(mode==='forgot') {
        const {error}=await supabase.auth.resetPasswordForEmail(String(data['email']),{redirectTo:`${window.location.origin}/reset-password`});
        if(error) throw error;
        setNotice('If an account exists for this address, a password reset link will arrive by email.');
      } else {
        const {error}=await supabase.auth.signInWithPassword({email:String(data['email']),password:String(data['password'])});
        if(error) throw error;
        await navigate({to:'/account'});
      }
    } catch(err) { setError(err instanceof Error ? (err.name==='ZodError' ? 'Use a valid email and a password of at least 12 characters, including uppercase, lowercase and a number.' : err.message) : 'Please try again.'); }
    finally {setBusy(false);}
  }
  return <section className="relative min-h-screen bg-night px-6 pb-20 pt-36"><img src={campus} alt="School library" className="absolute inset-0 h-full w-full object-cover opacity-30"/><div className="absolute inset-0 bg-veil"/><div className="relative mx-auto max-w-md rounded-lg border border-border bg-card p-7 shadow-elegant md:p-10">
    <ShieldCheck className="h-7 w-7 text-gold"/><p className="eyebrow mt-5">Alucard Institute</p><h1 className="mt-3 text-3xl">{mode==='register'?'Create school account':mode==='forgot'?'Reset your password':'Welcome back'}</h1>
    {user ? <div className="mt-6"><p className="text-muted-foreground">You’re signed in.</p><Button asChild className="mt-5 w-full"><Link to="/account">Open my account <ArrowRight/></Link></Button></div> : <>
    <form onSubmit={submit} className="mt-7 grid gap-5">
      {mode==='register' && <><Field label="Full name"><Input name="display_name" autoComplete="name" required maxLength={100}/></Field><Field label="Requested school role"><select name="requested_role" className="h-10 rounded-md border border-input bg-background px-3"><option value="student">Student</option><option value="teacher">Teacher</option></select></Field><p className="text-sm text-muted-foreground">School approval is required. Principal and administrator accounts are provisioned privately.</p></>}
      <Field label="Email address"><Input name="email" type="email" autoComplete="email" required/></Field>
      {mode!=='forgot' && <Field label="Password"><Input name="password" type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={mode==='register'?12:1} required/></Field>}
      {mode==='register' && <p className="text-xs text-muted-foreground">At least 12 characters, including uppercase, lowercase and a number.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-primary">{notice}</p>}
      <Button disabled={busy} type="submit" size="lg">{busy?'Please wait…':mode==='register'?'Request school access':mode==='forgot'?'Send reset link':'Sign in'}<ArrowRight/></Button>
    </form>
    <div className="mt-5 flex flex-wrap justify-between gap-2"><Button variant="link" onClick={()=>{setMode(mode==='register'?'signin':'register');setError('');setNotice('');}}>{mode==='register'?'Already have an account?':'Create an account'}</Button><Button variant="link" onClick={()=>{setMode(mode==='forgot'?'signin':'forgot');setError('');setNotice('');}}>{mode==='forgot'?'Back to sign-in':'Forgot password?'}</Button></div></>}
  </div></section>;
}