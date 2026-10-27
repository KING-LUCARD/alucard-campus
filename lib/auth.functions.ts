import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { usernameLoginSchema, usernameSchema } from './school-validation';

// Server-side helpers for username sign-in. Server modules are imported inside handlers so
// that service-role credentials never reach the browser bundle.

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 6;
function tooMany(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.first > WINDOW_MS) { attempts.set(key, { count: 0, first: now }); return false; }
  return a.count >= MAX_ATTEMPTS;
}
function fail(key: string) {
  const a = attempts.get(key) ?? { count: 0, first: Date.now() };
  a.count += 1; attempts.set(key, a);
}

/** Lets the sign-up form say whether a username is free. Reveals nothing else about accounts. */
export const checkUsername = createServerFn({ method: 'POST' })
  .inputValidator((input) => z.object({ username: usernameSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row, error } = await supabaseAdmin.from('profiles').select('id').ilike('username', data.username).maybeSingle();
    if (error) throw new Error('Could not check that username. Please try again.');
    return { available: !row };
  });

/**
 * Signs in with username (or email) + password. The email for a username is looked up on the server and never
 * sent to the browser. Every failure returns the same message so account existence is not revealed.
 */
export const loginWithUsername = createServerFn({ method: 'POST' })
  .inputValidator((input) => usernameLoginSchema.parse(input))
  .handler(async ({ data }) => {
    const generic = 'Invalid username or password.';
    const key = data.identifier;
    if (tooMany(key)) throw new Error('Too many attempts. Please wait a few minutes and try again.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    let email = data.identifier;
    if (!data.identifier.includes('@')) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('id').ilike('username', data.identifier).maybeSingle();
      if (!profile) { fail(key); throw new Error(generic); }
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (!user?.user?.email) { fail(key); throw new Error(generic); }
      email = user.user.email;
    }
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env['SUPABASE_URL']; const anon = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !anon) throw new Error('Sign-in is not configured.');
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, storage: undefined } });
    const { data: session, error } = await client.auth.signInWithPassword({ email, password: data.password });
    // Unverified emails and wrong passwords both fail here; the account must be verified by OTP first.
    if (error || !session.session) { fail(key); throw new Error(generic); }
    attempts.delete(key);
    return { access_token: session.session.access_token, refresh_token: session.session.refresh_token };
  });
