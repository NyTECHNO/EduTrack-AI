import { classesOn, toISO } from './calendarUtils.js';
import { formatTime } from './dateTime.js';

const startOf = (iso, hhmm) => {
  const [y, m, d] = iso.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi, 0, 0);
};
const isoOf = (date) => toISO(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// state: cancelled | done | ongoing | upcoming
function toOccurrence(schedule, iso, now) {
  const start = startOf(iso, schedule.startTime);
  const end = startOf(iso, schedule.endTime);
  const state = schedule.status === 'cancelled' ? 'cancelled' : now >= end ? 'done' : now >= start ? 'ongoing' : 'upcoming';
  return { key: `${schedule.id}_${iso}`, schedule, date: iso, start, end, state };
}

// Every class on one date (cancelled ones included, so people can see them), earliest first.
export function occurrencesOn(iso, schedules, now = new Date()) {
  return classesOn(iso, schedules).map((s) => toOccurrence(s, iso, now));
}

// Classes still to come (or in progress) over the next `days` days, earliest first.
export function upcomingOccurrences(schedules, now = new Date(), { days = 7, limit = 10 } = {}) {
  const active = schedules.filter((s) => s.status === 'active');
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const iso = isoOf(addDays(now, i));
    occurrencesOn(iso, active, now).filter((o) => o.state === 'upcoming' || o.state === 'ongoing').forEach((o) => out.push(o));
  }
  return out.sort((a, b) => a.start - b.start).slice(0, limit);
}

// "In 25 min", "In 2 h", "Tomorrow 8:00 AM", "Wed, Oct 28 9:00 AM"
export function whenLabel(occ, now = new Date()) {
  if (occ.state === 'ongoing') return 'In progress';
  const mins = Math.round((occ.start - now) / 60000);
  if (mins < 60) return `In ${Math.max(mins, 1)} min`;
  const time = formatTime(occ.schedule.startTime);
  const dayDiff = Math.round((new Date(occ.start.getFullYear(), occ.start.getMonth(), occ.start.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  if (dayDiff === 0) return `Today ${time}`;
  if (dayDiff === 1) return `Tomorrow ${time}`;
  return `${occ.start.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`;
}
