# New features: setup (3 steps)

1. **Database.** In Supabase → SQL Editor, run these two files in order (paste, press Run):
   - `drizzle/migrations/0004_school_extras.sql`
   - `drizzle/migrations/0005_username_login.sql`
   (0000–0003 must already be applied.)
2. **Email code.** Follow `AUTH_SETUP.md` (paste the email template, keep "Confirm email" ON, set up SMTP so Gmail codes arrive).
3. **Run.** `npm install --legacy-peer-deps` then `npm run dev`. Make sure `.env` has `SUPABASE_SERVICE_ROLE_KEY` (server only, never shared).

Where things are:
- Admin portal: applications (accept/decline, make student + class), assignments edit/delete, grade corrections, timetable, library, audit log + CSV exports.
- Teacher portal: library uploads (own classes only), term results entry, send to Principal.
- Principal portal: approve and publish term results.
- Student portal: timetable, library, report cards (only after Principal publishes).
- Sign out: menu, every portal, account page and the welcome page.
