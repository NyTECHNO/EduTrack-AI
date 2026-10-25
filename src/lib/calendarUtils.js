import { weekdayKey } from './dateTime.js';

const pad = (n) => String(n).padStart(2, '0');
export const toISO = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`; // month is 0-based

// Weeks (Sunday first) covering the month, including the neighbouring days that fill the first and last row.
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = Math.ceil((first.getDay() + daysInMonth) / 7);
  return Array.from({ length: rows }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const dt = new Date(year, month, 1 - first.getDay() + w * 7 + d);
    return { iso: toISO(dt.getFullYear(), dt.getMonth(), dt.getDate()), day: dt.getDate(), inMonth: dt.getMonth() === month };
  }));
}

// A weekly class happens on its weekdays, within its term dates when it has them.
export function classesOn(iso, schedules) {
  const key = weekdayKey(iso);
  return schedules
    .filter((s) => s.days.includes(key) && (!s.termStart || iso >= s.termStart) && (!s.termEnd || iso <= s.termEnd))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
