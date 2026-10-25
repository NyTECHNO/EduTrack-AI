// Times are stored as 24h "HH:MM" strings and shown in 12h. Days are stored as "Mon".."Sun".
// Phase 10 (reminders) will compute real instants in the Asia/Manila time zone from these.
export const DAYS = [
  { key: 'Mon', label: 'Monday' }, { key: 'Tue', label: 'Tuesday' }, { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' }, { key: 'Fri', label: 'Friday' }, { key: 'Sat', label: 'Saturday' },
  { key: 'Sun', label: 'Sunday' },
];
export const DAY_ORDER = Object.fromEntries(DAYS.map((d, i) => [d.key, i]));

export const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;
export const formatDays = (days = []) =>
  DAYS.filter((d) => days.includes(d.key)).map((d) => d.key).join(', ');

// Calendar dates are "YYYY-MM-DD" strings in the device's local time (Philippines for school users).
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const parseISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const weekdayKey = (iso) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseISO(iso).getDay()];
export const formatDate = (iso) =>
  parseISO(iso).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
