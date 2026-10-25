import test from 'node:test';
import assert from 'node:assert/strict';
import { findConflicts, findStudentConflicts, validateSchedule } from '../src/lib/scheduleUtils.js';
import { classesOn, monthGrid } from '../src/lib/calendarUtils.js';
import { occurrencesOn, upcomingOccurrences, whenLabel } from '../src/lib/classTimes.js';
import { formatTime, formatTimeRange, weekdayKey } from '../src/lib/dateTime.js';

const base = { id: 'a', subjectCode: 'IT1', instructorId: 'i1', instructorName: 'Cruz', room: 'R2', days: ['Tue', 'Thu'], startTime: '09:00', endTime: '10:30', status: 'active', studentIds: ['s1'] };

test('double-booked instructor and room are detected; touching times are not', () => {
  const cand = { ...base, id: 'new', startTime: '10:00', endTime: '11:00', subjectName: 'X' };
  assert.equal(findConflicts(cand, [base]).length, 2);
  assert.equal(findConflicts({ ...cand, startTime: '10:30', endTime: '11:30' }, [base]).length, 0);
  assert.equal(findConflicts({ ...cand, instructorId: 'i2', room: 'R9' }, [base]).length, 0);
});
test('cancelled classes and different terms never conflict', () => {
  const cand = { ...base, id: 'new' };
  assert.equal(findConflicts(cand, [{ ...base, status: 'cancelled' }]).length, 0);
  assert.equal(findConflicts({ ...cand, termStart: '2026-12-01', termEnd: '2027-03-01' }, [{ ...base, termStart: '2026-08-01', termEnd: '2026-11-30' }]).length, 0);
});
test('a student cannot be enrolled in two classes at the same time', () => {
  const other = { ...base, id: 'b', subjectCode: 'MA1', studentIds: ['s1'] };
  assert.equal(findStudentConflicts({ ...base, id: 'c' }, [{ uid: 's1', name: 'Ana' }], [other]).length, 1);
  assert.equal(findStudentConflicts({ ...base, id: 'c' }, [{ uid: 's2', name: 'Ben' }], [other]).length, 0);
});
test('schedule validation', () => {
  const ok = { subjectId: 's', instructorId: 'i', days: ['Mon'], startTime: '08:00', endTime: '09:00', room: 'R1', termStart: '', termEnd: '' };
  assert.deepEqual(validateSchedule(ok), {});
  assert.ok(validateSchedule({ ...ok, endTime: '07:00' }).endTime);
  assert.ok(validateSchedule({ ...ok, days: [] }).days);
  assert.ok(validateSchedule({ ...ok, termStart: '2026-10-02', termEnd: '2026-10-01' }).termEnd);
});
test('calendar: October 2026 grid and term-limited classes', () => {
  const grid = monthGrid(2026, 9);
  assert.equal(grid.length, 5); assert.equal(grid[0][0].iso, '2026-09-27'); assert.equal(grid.at(-1).at(-1).iso, '2026-10-31');
  assert.equal(weekdayKey('2026-10-20'), 'Tue');
  const s = [{ ...base, termStart: '2026-10-06', termEnd: '2026-10-20' }];
  assert.equal(classesOn('2026-10-01', s).length, 0); assert.equal(classesOn('2026-10-20', s).length, 1); assert.equal(classesOn('2026-10-27', s).length, 0);
});
test('class state and next-class labels', () => {
  const at = (h, m) => new Date(2026, 9, 20, h, m);
  assert.equal(occurrencesOn('2026-10-20', [base], at(8, 0))[0].state, 'upcoming');
  assert.equal(occurrencesOn('2026-10-20', [base], at(9, 30))[0].state, 'ongoing');
  assert.equal(occurrencesOn('2026-10-20', [base], at(11, 0))[0].state, 'done');
  const next = upcomingOccurrences([base], at(8, 40))[0];
  assert.equal(whenLabel(next, at(8, 40)), 'In 20 min');
  assert.equal(whenLabel(upcomingOccurrences([base], at(11, 0))[0], at(11, 0)), 'Thu, Oct 22 9:00 AM');
});
test('time formatting', () => { assert.equal(formatTime('00:05'), '12:05 AM'); assert.equal(formatTime('13:30'), '1:30 PM'); assert.equal(formatTimeRange('09:00', '10:30'), '9:00 AM – 10:30 AM'); });
