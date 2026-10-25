# JOHN PAUL COLLEGE (EduTrack AI)

Academic management web app for John Paul College, Roxas, Oriental Mindoro: accounts, subjects and schedules, attendance, grades,
calendar, class reminders, a school-information chatbot, and role-based dashboards for Admins, Instructors and Students.

**Stack:** React 18 + Vite, React Router, Firebase Authentication (email/password), Cloud Firestore, PWA (manifest + service worker).
Runs entirely on the **free Firebase Spark plan** (no Cloud Functions needed).

## Status

All 14 planned phases plus a Phase 15 (Admin activity log) are built: setup and branding, Firebase and auth, account management, subjects and schedules, attendance, grades,
student views, calendar, reminders, chatbot, profile and settings, dashboards, and the final hardening pass.
Run `npm test` for the automated tests (grading, scheduling, attendance, reminders, chatbot, validation).
Nothing was tested in a real browser by the developer who wrote it: follow `docs/TESTING.md` once on your own devices.

## Quick start

```bash
npm install
cp .env.example .env        # then fill in your Firebase web app values
npm run dev                 # http://localhost:5173
```

## One-time Firebase setup

1. Create a Firebase project. Enable **Authentication > Email/Password** and create a **Firestore** database (production mode).
2. Add a Web app (Project settings > Your apps) and put its config values in `.env`.
3. Deploy rules and indexes (always use `--only`; the indexes take a few minutes to build):
   ```bash
   npm install -g firebase-tools && firebase login && firebase use <your-project-id>
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. Create the first Admin (there is no public sign-up). Download a service-account key (Project settings > Service accounts), save it as
   `service-account.json` (git-ignored, never share it), then:
   ```bash
   # PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS=".\service-account.json"
   # Mac/Linux:   export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   npm run seed:admin -- admin@yourschool.edu "Full Name" "a-strong-password"
   ```
5. Sign in, then in this order: **Grading settings** (review the placeholders and save), **Subjects**, **Accounts**, **Schedules**,
   **School information** (import the suggested drafts, review and publish).

## Publishing the site (free)

```bash
npm run build
firebase deploy --only hosting
```
The hosting address is added to Firebase Authentication's authorized domains automatically.

## Appearance

Fonts: Lora (headings) and Source Sans 3 (text). Settings > Appearance offers **System default, Light and Dark**; the choice is stored per device and applied before the first paint.
All colours are CSS variables in `src/styles/tokens.css` (light values on `:root`, dark values on `:root[data-theme='dark']`).

## Roles

| Role | Can do |
|---|---|
| Admin | Create/edit/deactivate accounts, review the activity log, manage subjects and schedules, enroll students, set grading policy, manage chatbot knowledge, view attendance and grade reports |
| Instructor | See own classes and rosters, take and correct attendance, enter grades (computed or manual), export reports |
| Student | See own schedule, calendar, attendance, grades, notifications, use the chatbot |

## Project structure

```
src/app/            routing and providers          src/features/<module>/   one folder per module
src/components/     shared layout and UI            src/lib/                 pure logic (grades, schedules, CSV, dates)
src/firebase/       Firebase setup and paging       tests/                   automated tests (npm test)
public/             manifest, icons, service worker docs/                    schema, security notes, test checklist
functions/          unused Cloud Functions (see below)   scripts/            first-admin script
```

## Documentation

- `docs/FIRESTORE_SCHEMA.md` collections, fields, denormalized copies and indexes
- `docs/SECURITY.md` how access is enforced, and the known limits
- `docs/TESTING.md` responsive and role checklist to run in a browser

## Known limits and possible upgrades

- **Reminders only run while the app is open** (browser tab or installed PWA). Reminders when the app is closed need Cloud Functions with a
  schedule plus Firebase Cloud Messaging, which requires the Blaze plan. `public/service-worker.js` already handles push payloads, and `functions/`
  holds the earlier account functions (removed from `firebase.json`; add the `functions` entry back to use them).
- Grades are computed in the instructor's browser; the rules cannot recompute them (see `docs/SECURITY.md`).
- Cancelling a class cancels the whole schedule, not a single date. Exports are CSV only (no PDF).
- The attendance-rate policy (`src/lib/attendanceStats.js`) and the grading policy (Grading settings page) must be confirmed by the school.

## Chatbot knowledge (from the school website)

`src/features/school-info/data/suggestedDrafts.js` holds 21 entries paraphrased from johnpaulcollege.edu.ph (history, background, mission and vision,
guiding principles, every program level, admissions, contact details, the registrar, community programs). On **School information**, **Add website
information** adds them as drafts or publishes them at once. Left out on purpose: yearly events and news posts, and the individual youth feedback on the
MYClassroom page. Entries marked "Needs review" flag figures or names to confirm. The website has no list of core values; see the guiding-principles entry.
