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

## Header account menu
- [ ] Click your name in the header: a menu opens with Profile, Settings and Log out (the sidebar no longer has them). Clicking outside or pressing Esc closes it; Up/Down/Home/End move between items; Log out signs you out
- [ ] The name is never blank: an account without a name shows its ID number or email
- [ ] On a phone the menu stays inside the screen

## Sign-in and install
- [ ] Login asks for an ID number; typing `1234567` shows `12-3-4567`; a wrong format is refused with a clear message; a wrong ID or password says "ID number or password is incorrect"
- [ ] Admin: creating an account needs an ID in the 12-3-4567 format and shows the ID (not an email) with the temporary password; a second account with the same ID is refused
- [ ] The first screen (and Settings > Appearance) is Light by default; Dark only appears after choosing it, and survives reload
- [ ] Built app (`npm run build && npm run preview`): the browser offers Install; the installed app opens in its own window with the seal icon; turning the network off still opens the app or shows the offline page; Settings > Install the app reflects the state
- [ ] iPhone/iPad: Share > Add to Home Screen gives the seal icon and opens without browser bars

## Appearance
- [ ] Settings > Appearance: System default, Light and Dark each apply at once and survive a reload (no flash of the wrong theme)
- [ ] In Dark, check every page for text that is hard to read, white patches, or unreadable inputs, tables, calendar days, chat bubbles and modals
- [ ] Text is Public Sans in both themes and easy to read, including placeholders and small text (needs internet for Google Fonts; a plain system font is used offline)
- [ ] No word is ever split in the middle (look at table cells such as Status, Source and Actions at narrow widths)
- [ ] Filter bars (Accounts, Attendance and Grade reports, Activity log): every box has the same height and look, and From/To dates show their label inside the box

## Accounts navigation bar and chat
- [ ] Accounts: scroll down about 16px; the bar morphs into a floating pill (shadow follows the pill), and scrolling back up restores the full-width bar. Tabs (All, Students, Instructors, Admins) filter the list and stay clickable and visible in both states
- [ ] With "reduce motion" enabled in your system, the bar switches states without animation
- [ ] School assistant: hover (or Tab to) a message; it grows and the others dim, and everything returns together when the pointer leaves the list. With reduce motion, only the dimming remains

## Admin activity
- [ ] After creating an account, saving attendance or grades, and cancelling a class, each appears in **Activity log** with the right name and time

## Keyboard and accessibility
- [ ] Tab reaches everything in a sensible order; the "Skip to content" link appears on first Tab
- [ ] Focus ring is always visible; Esc closes modals, drawer and panels
