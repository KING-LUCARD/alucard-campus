# Sign-up with email code (OTP) — setup

The app sends the verification code through Supabase Auth, so no email credentials live in the frontend.

1. **Run the migration** `drizzle/migrations/0002_username_login.sql` on your database (adds `profiles.username`).
2. **Supabase → Authentication → Providers → Email**: keep *Confirm email* ON.
3. **Supabase → Authentication → Email Templates → Confirm signup**: paste `supabase/templates/confirmation.html`
   (it prints `{{ .Token }}`, the 6-digit code). Without this the email contains a link instead of a code.
4. **Sending to Gmail inboxes reliably**: Supabase's built-in sender is rate-limited and for testing only.
   Under *Authentication → SMTP Settings* add your own SMTP provider (Resend, Brevo, SendGrid, Gmail SMTP with an App Password).
   Keep those credentials in Supabase, never in this repo.
5. Environment: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` must be set on the server
   (the service-role key is used only in `src/lib/auth.functions.ts`, server-side).
6. `bun install` (adds `lenis` for smooth scrolling), then `bun run dev`.

Flow: Welcome → Sign Up (name, username, email, password) → code emailed → enter code → account verified →
Log In with **username + password** → site opens. Log In never asks for a code again.
