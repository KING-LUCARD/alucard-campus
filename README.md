# Alucard Campus 

MASTER PROMPT: ALUCARD INSTITUTE — ADVANCED SCHOOL MANAGEMENT WEBSITE WITH RBAC, MFA, AND SCROLL ANIMATIONS

Act as a senior full-stack developer, cybersecurity engineer, UI/UX designer, database architect, and animation specialist.

Build a complete, modern, premium school website and management system for ALUCARD INSTITUTE.

The website must combine an impressive public-facing school website with a functional school management system containing four separate portals:

Admin

Principal

Teacher

Student

Implement secure registration, sign-in, Multi-Factor Authentication (MFA), Role-Based Access Control (RBAC), a persistent database, and a centralized Admin dashboard.

The website must feature advanced, continuous scroll-triggered animations throughout the experience. As visitors scroll, the website should feel alive, polished, cinematic, and interactive. Do not limit animations to the homepage or button hover effects.

Build the actual application and source code. Do not deliver only a visual mockup, design concept, or written explanation.

1. BRANDING AND VISUAL DIRECTION

School name: ALUCARD INSTITUTE

Create a premium, sophisticated identity for an advanced educational institution.

Use:

Deep midnight navy or near-black backgrounds where appropriate.

White and light neutral surfaces for readability.

Refined silver or gold accents.

Modern typography with clear visual hierarchy.

High-quality educational and campus imagery.

Sophisticated gradients, subtle lighting effects, and layered compositions.

Spacious layouts, elegant cards, and clean navigation.

Professional icons and consistent branding.

Create a distinctive logo treatment using the words ALUCARD INSTITUTE. Keep the logo, school name, colors, contact details, and school information easy to change later.

The website should feel custom-built rather than like a generic school template.

Use a combination of dark and light sections to create visual contrast. Keep dashboards highly readable and practical, even when using a premium visual style.

2. ADVANCED SCROLL-TRIGGERED ANIMATIONS — HIGHEST VISUAL PRIORITY

Use Motion for React (Framer Motion) or another suitable animation library to create a polished scrolling experience across the public website and the authenticated portals.

The animations must respond naturally to the user's scrolling position.

A. Scroll-reveal animations

Whenever a user scrolls into a new section:

Text should fade in and move smoothly into position.

Headings should reveal themselves with staggered word or line animations.

Paragraphs should appear after their headings.

Images should slide into view or reveal through a clipping mask.

Cards should appear sequentially rather than all at once.

Icons and decorative elements should animate subtly.

Background elements should transition smoothly as sections enter the viewport.

Use a mixture of fade-up, fade-in, slide-in, scale-up, and staggered reveal effects.

Avoid applying exactly the same animation to every element. Vary the motion according to the content and layout.

B. Scroll-linked animations

Use scroll progress to control selected visual elements.

Examples include:

A progress indicator along the top or side of the page that advances as the user scrolls.

Images that move slightly at a different speed from surrounding content to create subtle parallax.

Background gradients that shift gradually between sections.

Decorative shapes that move gently with scroll progress.

Section titles that transform or reveal themselves as the user reaches a section.

Image galleries with smooth, scroll-linked visual transitions.

A hero image that gradually scales or changes position as the visitor moves down the page.

Use scroll-linked animation selectively. Avoid making the page difficult to navigate or causing content to jump.

C. Cinematic hero section

Create a visually impressive homepage opening.

Include:

A large, high-quality hero image or background.

The ALUCARD INSTITUTE brand.

A strong educational headline.

A short introductory paragraph.

Prominent Admissions and Explore Our School buttons.

Animated text entrance.

Subtle image zoom or parallax.

Layered background effects.

A scroll indicator encouraging visitors to continue.

As the visitor begins scrolling, transition the hero smoothly into the next section.

Do not block scrolling with unnecessary loading screens or forced animation sequences.

D. Animated school statistics

Create statistics for items such as student enrollment, teaching staff, academic programs, and achievements.

When the statistics enter the viewport:

Numbers should count up smoothly.

Labels should appear with subtle staggered animations.

Cards should transition into view.

Progress indicators should animate where appropriate.

Clearly use sample figures until real school data is provided. Do not present invented statistics as verified facts.

E. Interactive cards and image galleries

Create smooth hover and scroll effects for:

Academic program cards.

Teacher profiles.

News articles.

Campus photographs.

Student activities.

Events.

Portal shortcuts.

Cards may gently lift, scale, or reveal additional information on hover.

Images may use restrained zoom effects and smooth transitions.

Do not overuse perspective or 3D effects. The overall experience must remain professional.

F. Animation performance and accessibility

Respect the user's reduced-motion preferences.

Avoid excessive GPU-heavy effects.

Prevent layout shifts.

Keep scrolling responsive on mobile devices.

Avoid animations that interfere with forms, authentication, MFA, or accessibility.

Ensure content remains visible if JavaScript or animations fail.

Avoid introducing animation delays that make the application feel slow.

Acceptance requirement: scroll through every major page and verify that the intended scroll-triggered and scroll-linked animations actually work. Do not simply install an animation library and leave the components static.

3. PUBLIC WEBSITE PAGES

Build a complete public-facing website with working navigation.

Home

Cinematic hero section.

Scroll-triggered welcome message.

Animated school statistics.

Mission and vision sections.

Academic program cards.

Principal's welcome message.

School facilities.

Student activities.

News and announcements.

Upcoming events.

Testimonials.

Admissions call to action.

Contact section.

About Alucard Institute

School introduction.

History.

Vision and mission.

Core values.

Leadership.

Facilities.

Academic philosophy.

Achievements.

Academics

Academic programs.

Subjects and departments.

Teaching approach.

Learning resources.

Examination information.

Extracurricular activities.

Admissions

Admission requirements.

Application instructions.

Online application form.

Application status.

Confirmation and validation messages.

News and Events

News articles.

Announcements.

Event listings.

Dates and descriptions.

Search and filtering.

Individual article pages.

Contact

Contact form.

Editable school address.

Editable telephone and email.

Office hours.

Social media links.

Map integration placeholder.

Use realistic sample content and clearly identify details that require replacement. Do not invent actual school contact details or claim fictional achievements are real.

4. REGISTRATION AND SIGN-IN

Create polished, responsive registration and login pages that match the school's visual identity.

The registration page must allow the user to choose one of four categories:

Admin

Principal

Teacher

Student

Display each category in a distinct interactive card with an icon, a short description, and a selection animation.

When the user selects a category:

Highlight the selected role.

Display the appropriate registration fields.

Explain whether approval is required.

Validate the form.

Show clear loading, success, and error states.

Critical role-assignment security

Selecting a role must not automatically grant its permissions.

Implement these rules:

Students may register through an approved student registration process.

Teacher accounts must be created or approved by an authorized Admin.

Principal accounts must be created or approved by an authorized Admin.

Admin accounts must be created through a secure provisioning process.

Public registration must never create an active administrator account.

Restricted-role requests should remain pending until approved.

Role assignments must be validated by the backend.

Provide:

Email verification.

Secure sign-in and logout.

Forgot-password functionality.

Password reset.

Account status messages.

Session expiration handling.

MFA setup and verification.

Recovery procedures.

After successful authentication, retrieve the user's assigned role from the trusted server-side identity or database and redirect them to the correct dashboard.

Never trust role information submitted by the browser.

5. ROLE-BASED ACCESS CONTROL (RBAC)

Implement real RBAC on the backend and frontend.

Create a centralized permissions system with permissions such as:

users.view

users.create

users.update

users.disable

roles.assign

permissions.manage

students.view

students.manage

teachers.view

teachers.manage

attendance.view

attendance.manage

results.view

results.manage

results.approve

announcements.manage

reports.view

settings.manage

audit_logs.view

Create role-permission mappings in the database or a centrally managed authorization configuration.

Requirements:

Deny access by default.

Enforce authorization on every protected API endpoint.

Verify ownership and record-level permissions.

Prevent privilege escalation.

Enforce least privilege.

Record important permission changes.

Revoke access when accounts are disabled.

Never depend on hiding frontend buttons for security.

The Admin controls role assignments and permissions, subject to the application's security rules.

The Principal oversees school operations.

Teachers manage assigned classes and educational activities.

Students access only their own authorized learning services.

6. ADMIN PORTAL — CENTRAL CONTROL CENTER

The Admin portal is the main system-management interface.

Build a comprehensive dashboard with animated statistics, responsive tables, search, filters, notifications, and a professional sidebar.

User management

Create and manage accounts.

Approve or reject registration requests.

Assign and revoke roles.

Configure role permissions.

Disable and reactivate accounts.

Revoke sessions.

Require MFA enrollment.

Manage invitations.

Review account status and authentication activity.

Academic and school management

Manage students.

Manage teachers and principals.

Create classes and subjects.

Assign teachers to classes.

Manage academic sessions and terms.

Configure timetables.

Manage enrollment.

View attendance.

Configure grading rules.

Review results.

Manage announcements and events.

Generate reports.

Security management

Configure MFA requirements.

Review login activity.

Review failed login attempts.

Review security events.

View audit logs.

Revoke sessions.

Manage account security policies.

Review privileged-account requests.

Require appropriate authorization and recent authentication for sensitive actions.

Do not allow the Admin interface to expose plaintext passwords, MFA secrets, or recovery codes.

7. PRINCIPAL PORTAL

Create a distinct Principal dashboard focused on leadership and school-wide academic oversight.

Include:

School-wide academic statistics.

Student and staff counts.

Attendance summaries.

Examination schedules.

Academic performance reports.

Teacher assignments.

Authorized staff attendance information.

Class performance comparisons.

Results awaiting approval.

School announcements.

Timetable oversight.

Events and activities.

Enrollment reports.

Teacher communications.

The Principal should be able to review submitted grades and approve or return results for correction if permitted by the configured school policy.

The Principal must not automatically have full administrative privileges.

They must not be able to promote themselves to Admin, change global RBAC configuration without permission, or access protected security secrets.

Apply scroll-triggered reveals and subtle chart animations to the dashboard without sacrificing usability.

8. TEACHER PORTAL

Create a separate Teacher dashboard.

Include:

Assigned classes and subjects.

Daily timetable.

Class rosters.

Attendance recording.

Attendance history.

Assignment creation.

Homework submissions.

Assessment creation where supported.

Grade entry.

Result submission for approval.

Class performance reports.

Student learning resources.

Announcements.

Notifications.

Teachers must only manage the classes, students, and subjects they are authorized to access.

Prevent unauthorized editing of other teachers' records, global settings, or administrative permissions.

Animate dashboard cards and charts smoothly as they appear. Keep grade entry, attendance forms, and tables fast and accessible.

9. STUDENT PORTAL

Create a separate Student dashboard focused on learning.

Include:

Personal profile.

Current class and subjects.

Timetable.

Assignments.

Homework submission.

Learning resources.

Examination schedules.

Published grades.

Report cards.

Attendance history.

School announcements.

Notifications.

MFA and account settings.

Students must only be able to access their own private academic records and other explicitly authorized resources.

Students must not modify grades, mark their own attendance, view other students' private records, or access staff and administration services.

Use tasteful scroll and entrance animations while keeping the interface simple enough for daily use.

10. MULTI-FACTOR AUTHENTICATION (MFA)

Implement genuine MFA using TOTP and compatible authenticator applications, or use an authentication provider with verified MFA support.

Role-specific MFA policy

Admin: mandatory.

Principal: mandatory.

Teacher: mandatory.

Student: configurable, with the ability to require MFA for all students.

Enrollment

Require an authenticated session.

Require recent authentication before security-setting changes.

Generate a unique MFA secret.

Display a QR code.

Verify the first valid authenticator code.

Activate MFA only after successful verification.

Generate secure recovery codes.

Display recovery codes once and instruct users to store them securely.

Login

Verify the primary credentials.

Create a restricted MFA challenge.

Request the authenticator code or a valid unused recovery code.

Verify the code server-side.

Complete authentication only after successful verification.

Establish the authenticated session.

Protect against brute force using rate limiting, attempt limits, challenge expiration, and monitoring.

Hash recovery codes when implementing them directly. Protect MFA secrets at rest and never expose them through ordinary API responses or logs.

Recovery must not provide a simple bypass around MFA.

The MFA interface should include polished transitions, clear status indicators, accessible code inputs, and helpful error messages. The animations must not delay or interfere with authentication.

11. DATABASE AND BACKEND

Use React, TypeScript, Tailwind CSS, and Motion for React for the frontend.

Use a compatible backend with PostgreSQL or Supabase.

Implement a real database with tables such as:

users

roles

permissions

role_permissions

user_roles, if multiple roles per user are supported

student_profiles

teacher_profiles

principal_profiles

classes

subjects

class_enrollments

teacher_assignments

attendance

assignments

assignment_submissions

assessments

grades

announcements

notifications

academic_sessions

timetables

audit_logs

admission_applications

Include appropriate foreign keys, indexes, constraints, timestamps, migrations, and seed data.

Implement real backend APIs, server-side validation, database persistence, and appropriate error handling.

If using Supabase, configure Row Level Security policies to protect private records. Never expose the service-role key in client-side code.

Do not use browser localStorage as the primary database.

12. CYBERSECURITY REQUIREMENTS

Implement:

Secure password hashing.

Email verification.

Secure password-reset tokens.

Session management and revocation.

HttpOnly and Secure cookies where appropriate.

CSRF protection where applicable.

Login rate limiting.

Server-side validation.

Safe database queries.

Protection against SQL injection and XSS.

Secure HTTP headers.

Restricted CORS.

Authorization on protected endpoints.

Protection against privilege escalation.

Safe file uploads.

Environment variables for secrets.

Audit logging for sensitive operations.

Never commit real secrets to the repository.

Provide a .env.example file containing placeholder variable names only.

Document the security controls implemented and any remaining production configuration requirements.

13. MOTION DESIGN ACROSS ALL PAGES

Do not restrict the animation system to the public homepage.

Implement a consistent motion system for:

Public pages: Scroll-reveal text, image reveals, parallax, animated statistics, card transitions, and section progress indicators.

Admin portal: Dashboard card entrances, smooth navigation transitions, animated charts, table loading states, expandable sidebars, and modal transitions.

Principal portal: Academic charts, report cards, statistics, and section reveals.

Teacher portal: Class card animations, task status transitions, notification reveals, and smooth form feedback.

Student portal: Dashboard entrance animations, assignment cards, notification transitions, and progress indicators where meaningful.

Authentication: Role-selection animations, registration steps, form validation feedback, and MFA state transitions.

Create reusable animation variants and shared components instead of implementing unrelated animations independently on every page.

Ensure animations remain smooth, consistent, and accessible.

14. TESTING

Create automated tests for the most important workflows.

Verify:

Registration and login.

Email verification and password reset.

MFA enrollment and login verification.

Recovery-code single-use behavior.

Role approval.

Admin permission management.

Teacher restrictions.

Principal restrictions.

Student record isolation.

Unauthorized API access.

Database persistence.

Session revocation.

Responsive layouts.

Scroll animations across all major pages.

Production build success.

Test privilege escalation, direct API access, and attempts to read another user's records.

Fix errors before declaring the project complete.

15. DEPLOYMENT AND PROJECT DELIVERY

Prepare the application for deployment.

Provide:

Complete source code.

Organized project folders.

Database migrations.

Seed scripts.

.env.example.

.gitignore.

README.

Local setup instructions.

Test commands.

Production build instructions.

Deployment instructions.

HTTPS configuration guidance.

Database setup and backup guidance.

Instructions for securely provisioning the first Admin account.

Build directly in the available coding environment when possible. Do not merely print snippets and claim that the application has been created.

If external credentials are needed, explain exactly what must be configured.

Do not claim that the site is live, fully tested, or production-secure unless those conditions have actually been verified.

FINAL ACCEPTANCE REQUIREMENT

Deliver a working ALUCARD INSTITUTE school management website with:

Four distinct portals: Admin, Principal, Teacher, and Student.

Registration with role selection and secure approval rules.

Genuine RBAC enforced on the backend.

Genuine MFA with authenticator codes and recovery codes.

A persistent database.

Role-specific academic and administrative services.

An Admin-controlled management dashboard.

Protected student information.

Responsive layouts.

Advanced scroll-triggered and scroll-linked animations throughout the website.

Working forms and navigation.

Automated security and functional tests.

A clear path to deployment.

Start by inspecting the available project environment. Then build the actual application, implement the database and authentication, test the core workflows, fix errors, and prepare the project for deployment.

Prioritize three things above everything else: premium scroll animations, genuinely functional role-based portals, and security that is enforced by the backend rather than merely displayed in the interface.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76b4b881-30d9-53d0-96ca-6867faa172bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
