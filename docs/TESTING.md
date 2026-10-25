# Testing checklist

Run `npm test` first (automated logic tests). Then check in a browser. Use real test accounts: one Admin, one Instructor, one Student.

## Responsive widths (browser dev tools > device toolbar, and your own phone)
320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px. Also check: landscape on a phone, browser zoom 200%, sidebar expanded and collapsed.

For each width, as each role, open every page and confirm:
- [ ] No sideways scrolling of the page (tables may scroll inside their own box)
- [ ] No overlapping or clipped text; long names wrap
- [ ] Sidebar: collapses to icons with tooltips on wide screens; opens as a drawer on small screens and closes on page tap, overlay tap, close button and Esc
- [ ] Buttons and inputs are easy to tap; forms stack on small screens; modals fit the screen and scroll
- [ ] Calendar shows the month grid on wide screens and the agenda on phones
- [ ] Notification panel and toasts stay inside the screen; chat input stays visible with the keyboard open

## Role checks
- **Admin:** create Student and Instructor accounts; edit, deactivate (they are signed out) and reactivate; reset password email; create subject and schedule; try a double-booked room (must be refused); enroll a student; cancel and reinstate a class; save grading settings; import, edit and publish school information.
- **Instructor:** sees only own classes; take attendance, reopen a date and correct it; add assessments and scores; switch between computed and manual grades; export CSV; cannot open Accounts or Subjects.
- **Student:** sees only own schedule, attendance and grades with breakdown; cannot see classmates; chatbot answers published topics and says "not available" for others.
- **Cross-checks:** a deactivated user cannot sign in; a student opening `/accounts` is sent to the dashboard; an instructor cannot read another instructor's class.
- **Reminders:** schedule a class today starting in 10 to 25 minutes; the bell, toast and (if allowed) browser notification appear once.

## Appearance
- [ ] Settings > Appearance: System default, Light and Dark each apply at once and survive a reload (no flash of the wrong theme)
- [ ] In Dark, check every page for text that is hard to read, white patches, or unreadable inputs, tables, calendar days, chat bubbles and modals
- [ ] Headings use Lora and everything else Source Sans 3 (needs internet for Google Fonts; a plain serif/sans fallback is used offline)

## Admin activity
- [ ] After creating an account, saving attendance or grades, and cancelling a class, each appears in **Activity log** with the right name and time

## Keyboard and accessibility
- [ ] Tab reaches everything in a sensible order; the "Skip to content" link appears on first Tab
- [ ] Focus ring is always visible; Esc closes modals, drawer and panels
