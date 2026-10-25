import { formatDays, formatTimeRange, toMinutes } from './dateTime.js';

const timesOverlap = (a, b) => toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
const termsOverlap = (a, b) =>
  (a.termStart || '0000-01-01') <= (b.termEnd || '9999-12-31') && (b.termStart || '0000-01-01') <= (a.termEnd || '9999-12-31');

// Two active schedules clash when they share a weekday, overlapping times and overlapping terms.
export function clashes(a, b) {
  return a.status !== 'cancelled' && b.status !== 'cancelled'
    && a.days.some((d) => b.days.includes(d)) && timesOverlap(a, b) && termsOverlap(a, b);
}

const describe = (s) => `${s.subjectCode} (${formatDays(s.days)}, ${formatTimeRange(s.startTime, s.endTime)})`;

// Instructor and room double-booking.
export function findConflicts(candidate, schedules, excludeId) {
  const messages = [];
  schedules.forEach((s) => {
    if (s.id === excludeId || !clashes(candidate, s)) return;
    if (s.instructorId === candidate.instructorId) messages.push(`${candidate.instructorName} already teaches ${describe(s)}.`);
    if (candidate.room && s.room.trim().toLowerCase() === candidate.room.trim().toLowerCase()) {
      messages.push(`Room ${s.room} is already used by ${describe(s)}.`);
    }
  });
  return messages;
}

// A student cannot be in two classes at the same time.
export function findStudentConflicts(schedule, students, schedules) {
  const messages = [];
  students.forEach((student) => {
    schedules.forEach((s) => {
      if (s.id === schedule.id || !(s.studentIds || []).includes(student.uid) || !clashes(schedule, s)) return;
      messages.push(`${student.name} already has ${describe(s)}.`);
    });
  });
  return messages;
}

export function validateSchedule(v) {
  const errors = {};
  if (!v.subjectId) errors.subjectId = 'Choose a subject.';
  if (!v.instructorId) errors.instructorId = 'Choose an instructor.';
  if (!v.days.length) errors.days = 'Choose at least one day.';
  if (!v.startTime) errors.startTime = 'Set the start time.';
  if (!v.endTime) errors.endTime = 'Set the end time.';
  if (v.startTime && v.endTime && toMinutes(v.endTime) <= toMinutes(v.startTime)) errors.endTime = 'End time must be after the start time.';
  if (!v.room.trim()) errors.room = 'Enter the room.';
  if (v.termStart && v.termEnd && v.termEnd < v.termStart) errors.termEnd = 'End date must be on or after the start date.';
  return errors;
}
