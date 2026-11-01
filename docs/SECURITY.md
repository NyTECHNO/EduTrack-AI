# Security model

## How access is enforced
1. **Identity:** Firebase Authentication (email and password). There is no public registration page; only an Admin creates accounts (a second Firebase app instance is used so the Admin stays signed in).
2. **Role and status** live in `users/{uid}`. Every Firestore rule reads that document, so deactivating an account blocks data access immediately. Users cannot edit their own role or status (rules allow only phone and preferences; an Admin may also edit their own name).
3. **Firestore rules** (`firestore.rules`) are the real enforcement; route guards in the app are only for convenience. Anything not explicitly allowed is denied.
4. **Instructors** can write attendance, assessments, gradebooks and grades only for classes where `schedules.instructorId` is their uid, and grades only for students in `studentIds`.
5. **Students** read only their own attendance records, grades, notifications and the classes that list them. Class lists with names and ID numbers (`rosters`) are not readable by students.
6. **Secrets:** no Admin credentials in the frontend. `service-account.json` and `.env` are git-ignored. Firebase web config values are public identifiers, not secrets.

## ID sign-in and password resets
- Sign-in uses an internal address made from the ID number (`12-3-4567@id.edutrack.local`); IDs are unique because Firebase will not create two accounts with the same address. The ID cannot be changed after creation.
- The internal address has no mailbox, so **an emailed password reset is impossible for ID accounts.** People can change their own password in Settings while signed in. Resetting a *forgotten* password is done by the project owner with `npm run reset:password` (uses the service-account key on their own computer; see the README). In-app resets by an Admin would need a Cloud Function (Blaze plan).
- Older email accounts keep working with email and the usual reset email.
- Anyone can try IDs and passwords on the login form; Firebase rate-limits repeated failures ("too many attempts"). Use strong temporary passwords.

## Activity log
Key changes (accounts, subjects, schedules, enrollment, attendance, grades, grading settings, school information) are recorded in `activityLog` with who and when.
The rules let anyone add an entry only under their own id and role, only Admins can read, and no one can edit or delete, so the trail can be trusted.
A user could still write misleading text in their own entries or skip logging by calling Firestore directly; treat the log as an audit aid, not a legal record.

## Known limits (be aware)
- **Sign-up on the Auth API:** Firebase allows anyone holding the project's public web key to create an Auth account. Such an account has no `users` document, so the app signs it out and the rules deny all data. Keep the Admin list clean by checking Authentication > Users now and then.
- **Grades are computed in the browser.** Rules check who may write and that manual grades are within the scale, but they cannot recompute a grade. This trusts instructors, which fits normal school use. Server-side computation would need Cloud Functions (Blaze plan).
- **Student ids on schedules:** `schedules.studentIds` holds uids of classmates (opaque, no names).
- **Rule cost:** each request reads `users/{uid}` to check the role, which adds one document read per request.
- **Notifications** are created by each person's own client, so a user could add notifications for themself only.
- Schedules created before `rosters` existed are upgraded automatically the first time an Admin opens Schedules or the dashboard.
- Review `firestore.rules` after any change, and redeploy with `firebase deploy --only firestore:rules`.
