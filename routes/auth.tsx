import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, MailCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/site/Field';
import { useSchoolAuth } from '@/components/SchoolAuth';
import { pageHead } from '@/lib/metadata';
import { otpSchema, registrationSchema } from '@/lib/school-validation';
import { checkUsername, loginWithUsername } from '@/lib/auth.functions';
import campus from '@/assets/library.jpg';

type Mode = 'signin' | 'register' | 'verify' | 'forgot';
const RESEND_SECONDS = 60;

export const Route = createFileRoute('/auth')({
  validateSearch: z.object({ mode: z.enum(['register', 'signin']).optional().catch(undefined) }),
  head: () => pageHead('School sign-in', 'Secure access to your Alucard Institute school account.'),
  component: Auth,
});

function PasswordInput({ name, autoComplete, minLength }: { name: string; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} minLength={minLength} required className="pr-11" />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-3 grid place-items-center text-muted-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Auth() {
  const { user } = useSchoolAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode === 'register' ? 'register' : 'signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function go(next: Mode) { setMode(next); setError(''); setNotice(''); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'register') {
        const parsed = registrationSchema.safeParse(data);
        if (!parsed.success) {
          const first = parsed.error.issues[0];
          throw new Error(first?.path[0] === 'confirm_password' ? 'Passwords do not match.' : first?.path[0] === 'username' ? first.message : first?.path[0] === 'password' ? 'Use a password of at least 12 characters, including uppercase, lowercase and a number.' : 'Please check your details and try again.');
        }
        const v = parsed.data;
        const { available } = await checkUsername({ data: { username: v.username } });
        if (!available) throw new Error('That username is already taken. Please choose another.');
        const { error: signUpError } = await supabase.auth.signUp({ email: v.email, password: v.password, options: { emailRedirectTo: window.location.origin, data: { display_name: v.display_name, username: v.username, requested_role: v.requested_role } } });
        if (signUpError) throw new Error(signUpError.message.includes('username_taken') ? 'That username is already taken. Please choose another.' : 'We could not create your account. Please check your details and try again.');
        setPendingEmail(v.email); setCooldown(RESEND_SECONDS); go('verify');
        setNotice(`We sent a 6-digit code to ${v.email}. Open Gmail on your phone or computer and enter it below.`);
      } else if (mode === 'verify') {
        const code = otpSchema.safeParse(String(data['otp'] ?? ''));
        if (!code.success) throw new Error(code.error.issues[0]?.message ?? 'Enter the 6-digit code.');
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code.data, type: 'signup' });
        if (verifyError) throw new Error('That code is incorrect or has expired. Check the code or request a new one.');
        // Verifying creates a session; sign out so the new user must enter their username and password to get in.
        await supabase.auth.signOut();
        go('signin');
        setNotice('Email verified. Your account is ready. Log in with your username and password to enter.');
      } else if (mode === 'forgot') {
        await supabase.auth.resetPasswordForEmail(String(data['email']).trim(), { redirectTo: `${window.location.origin}/reset-password` });
        setNotice('If an account exists for this address, a password reset link will arrive by email.');
      } else {
        const tokens = await loginWithUsername({ data: { identifier: String(data['identifier']), password: String(data['password']) } });
        const { error: sessionError } = await supabase.auth.setSession(tokens);
        if (sessionError) throw new Error('Invalid username or password.');
        await navigate({ to: '/home' });
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function resend() {
    if (cooldown > 0 || !pendingEmail) return;
    setError(''); setNotice('');
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: pendingEmail });
    if (resendError) { setError('We could not resend the code yet. Please wait a moment and try again.'); return; }
    setCooldown(RESEND_SECONDS); setNotice('A new code has been sent. Earlier codes no longer work.');
  }

  const title = mode === 'register' ? 'Create school account' : mode === 'verify' ? 'Verify your email' : mode === 'forgot' ? 'Reset your password' : 'Welcome back';
  return (
    <section className="relative min-h-screen bg-night px-6 pb-20 pt-36">
      <img src={campus} alt="School library" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-veil" />
      <div className="relative mx-auto max-w-md rounded-lg border border-border bg-card p-7 shadow-elegant md:p-10">
        <Link to="/" className="mb-6 inline-block text-sm font-semibold text-primary">← Back to welcome</Link>
        {mode === 'verify' ? <MailCheck className="block h-7 w-7 text-gold" /> : <ShieldCheck className="block h-7 w-7 text-gold" />}
        <p className="eyebrow mt-5">Alucard Institute</p>
        <h1 className="mt-3 text-3xl">{title}</h1>
        {user ? (
          <div className="mt-6"><p className="text-muted-foreground">You’re signed in.</p><Button asChild className="mt-5 w-full"><Link to="/home">Enter the school <ArrowRight /></Link></Button></div>
        ) : (
          <>
            {mode === 'verify' && <p className="mt-3 text-sm text-muted-foreground">Enter the 6-digit code we emailed you to confirm your address and finish creating your account.</p>}
            <form onSubmit={submit} className="mt-7 grid gap-5" noValidate={false}>
              {mode === 'register' && (
                <>
                  <Field label="Full name"><Input name="display_name" autoComplete="name" required maxLength={100} /></Field>
                  <Field label="Username"><Input name="username" autoComplete="username" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" title="3–20 letters, numbers or underscores" /></Field>
                  <Field label="Email address (Gmail or other)"><Input name="email" type="email" autoComplete="email" required /></Field>
                  <Field label="Password"><PasswordInput name="password" autoComplete="new-password" minLength={12} /></Field>
                  <Field label="Confirm password"><PasswordInput name="confirm_password" autoComplete="new-password" minLength={12} /></Field>
                  <p className="-mt-2 text-xs text-muted-foreground">At least 12 characters, including uppercase, lowercase and a number.</p>
                  <Field label="Account type"><select name="requested_role" className="h-10 rounded-md border border-input bg-background px-3"><option value="student">Student</option><option value="teacher">Teacher</option></select></Field>
                  <p className="text-sm text-muted-foreground">School approval is required. Principal and administrator accounts are provisioned privately.</p>
                </>
              )}
              {mode === 'verify' && (
                <Field label="6-digit verification code"><Input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="text-center font-display text-2xl tracking-[0.5em]" /></Field>
              )}
              {mode === 'forgot' && <Field label="Email address"><Input name="email" type="email" autoComplete="email" required /></Field>}
              {mode === 'signin' && (
                <>
                  <Field label="Username"><Input name="identifier" autoComplete="username" required /></Field>
                  <Field label="Password"><PasswordInput name="password" autoComplete="current-password" /></Field>
                </>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              {notice && <p role="status" className="text-sm text-primary">{notice}</p>}
              <Button disabled={busy} type="submit" size="lg">
                {busy ? 'Please wait…' : mode === 'register' ? 'Create account & send code' : mode === 'verify' ? 'Verify email' : mode === 'forgot' ? 'Send reset link' : 'Log in'}
                <ArrowRight />
              </Button>
            </form>
            {mode === 'verify' ? (
              <div className="mt-5 flex flex-wrap justify-between gap-2">
                <Button variant="link" type="button" disabled={cooldown > 0} onClick={() => void resend()}>{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</Button>
                <Button variant="link" type="button" onClick={() => go('register')}>Use a different email</Button>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap justify-between gap-2">
                <Button variant="link" type="button" onClick={() => go(mode === 'register' ? 'signin' : 'register')}>{mode === 'register' ? 'Already have an account? Log in' : 'Create an account'}</Button>
                <Button variant="link" type="button" onClick={() => go(mode === 'forgot' ? 'signin' : 'forgot')}>{mode === 'forgot' ? 'Back to log in' : 'Forgot password?'}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
