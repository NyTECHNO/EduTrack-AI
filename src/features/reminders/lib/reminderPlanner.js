import { classesOn, toISO } from '../../../lib/calendarUtils.js';
import { formatDays, formatTime, formatTimeRange } from '../../../lib/dateTime.js';

export const LEAD_MINUTES = 30;
const compact = (iso) => iso.replaceAll('-', '');

function startOf(iso, hhmm) {
  const [y, m, d] = iso.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi, 0, 0);
}

const bodyFor = (s, role) => [
  s.subjectName,
  `Room ${s.room}`,
  role === 'student' ? s.instructorName : s.section,
].filter(Boolean).join(' · ');

/**
 * Reminders that are due RIGHT NOW: classes starting within the next 30 minutes that have not started yet.
 * Planned from the live schedule list every time, so edits and cancellations take effect automatically.
 * The id is deterministic (user + date + class + start time), which is the duplicate protection;
 * a changed start time produces a new id, so the user is reminded at the new time.
 */
export function planReminders({ schedules, uid, role, now = new Date() }) {
  const due = [];
  [0, 1].forEach((offset) => { // today, plus tomorrow for very early classes
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const iso = toISO(day.getFullYear(), day.getMonth(), day.getDate());
    classesOn(iso, schedules.filter((s) => s.status === 'active')).forEach((s) => {
      const startsAt = startOf(iso, s.startTime);
      const opens = new Date(startsAt.getTime() - LEAD_MINUTES * 60000);
      if (now >= opens && now < startsAt) {
        due.push({
          id: `${uid}_${compact(iso)}_${s.id}_${s.startTime.replace(':', '')}`,
          type: 'class-reminder', scheduleId: s.id, classDate: iso,
          title: `${s.subjectCode} starts at ${formatTime(s.startTime)}`, body: bodyFor(s, role),
        });
      }
    });
  });
  return due;
}

// Classes cancelled in the last 7 days (the admin's cancel action stamps statusChangedAt).
export function planCancellations({ schedules, uid, now = new Date() }) {
  return schedules
    .filter((s) => s.status === 'cancelled' && s.statusChangedAt?.seconds && now.getTime() - s.statusChangedAt.seconds * 1000 < 7 * 86400000)
    .map((s) => ({
      id: `${uid}_cancelled_${s.id}_${s.statusChangedAt.seconds}`,
      type: 'class-cancelled', scheduleId: s.id, classDate: '',
      title: `${s.subjectCode} was cancelled`,
      body: `${s.subjectName} (${formatDays(s.days)}, ${formatTimeRange(s.startTime, s.endTime)}) has been cancelled.`,
    }));
}
