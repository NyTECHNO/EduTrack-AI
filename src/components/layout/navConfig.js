// One source of truth for navigation, route guards and the quick-jump search.
// `phase` says which build phase replaces the placeholder with the real page.
const ADMIN = ['admin'];
const INSTRUCTOR = ['instructor'];
const STUDENT = ['student'];
const ALL = ['admin', 'instructor', 'student'];

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ path: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ALL }],
  },
  {
    label: 'Administration',
    items: [
      { path: '/accounts', label: 'Accounts', icon: 'users', roles: ADMIN, phase: 4, blurb: 'Create, update and deactivate Student and Instructor accounts.' },
      { path: '/subjects', label: 'Subjects', icon: 'book', roles: ADMIN, phase: 5, blurb: 'Manage subjects and assign instructors.' },
      { path: '/schedules', label: 'Schedules', icon: 'clock', roles: ADMIN, phase: 5, blurb: 'Create class schedules, rooms and enrollments.' },
      { path: '/grading-settings', label: 'Grading settings', icon: 'award', roles: ADMIN, phase: 7, blurb: 'Set grading periods, scale, passing mark, rounding and category weights.' },
      { path: '/activity', label: 'Activity log', icon: 'clock', roles: ADMIN, phase: 15, blurb: 'See who changed what, and when.' },
      { path: '/school-info', label: 'School information', icon: 'school', roles: ADMIN, phase: 11, blurb: 'Maintain the knowledge base used by the chatbot.' },
    ],
  },
  {
    label: 'Academics',
    items: [
      { path: '/my-schedule', label: 'My schedule', icon: 'clock', roles: [...INSTRUCTOR, ...STUDENT], phase: 8, blurb: 'Your classes with instructor, subject, time and room.' },
      { path: '/calendar', label: 'Calendar', icon: 'calendar', roles: ALL, phase: 9, blurb: 'Monthly view of scheduled classes.' },
      { path: '/attendance', label: 'Attendance', icon: 'check', roles: [...ADMIN, ...INSTRUCTOR, ...STUDENT], phase: 6, blurb: 'Take, review and export attendance.' },
      { path: '/grades', label: 'Grades', icon: 'award', roles: [...ADMIN, ...INSTRUCTOR, ...STUDENT], phase: 7, blurb: 'Enter, compute and view grades.' },
    ],
  },
  {
    label: 'Help',
    items: [{ path: '/chatbot', label: 'School assistant', icon: 'message', roles: ALL, phase: 11, blurb: 'Ask about the college’s history, mission, values and programs.' }],
  },
];

export const ACCOUNT_ITEMS = [
  { path: '/profile', label: 'Profile', icon: 'user', roles: ALL, phase: 12, blurb: 'Your account details.' },
  { path: '/settings', label: 'Settings', icon: 'settings', roles: ALL, phase: 12, blurb: 'Preferences, notifications and password.' },
];

export const ALL_NAV_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), ...ACCOUNT_ITEMS];

export function itemsForRole(role) {
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
    .filter((g) => g.items.length);
  const account = ACCOUNT_ITEMS.filter((i) => i.roles.includes(role));
  return { groups, account, flat: [...groups.flatMap((g) => g.items), ...account] };
}
