import test from 'node:test';
import assert from 'node:assert/strict';
import { rateOf, formatRate, summarizeByStudent } from '../src/lib/attendanceStats.js';
import { buildCsv } from '../src/lib/csv.js';
import { planReminders, planCancellations } from '../src/features/reminders/lib/reminderPlanner.js';
import { getNotificationPrefs } from '../src/lib/preferences.js';
import { validateAccountForm } from '../src/lib/validators.js';
import { generateTempPassword } from '../src/lib/password.js';

test('attendance rate: present and late count, excused is left out', () => {
  assert.equal(rateOf({ present: 6, absent: 2, late: 1, excused: 1, total: 10 }), 7 / 9);
  assert.equal(formatRate(0.8333), '83.3%'); assert.equal(rateOf({ present: 0, absent: 0, late: 0, excused: 2, total: 2 }), null);
});
test('per-student summary', () => {
  const rows = summarizeByStudent([{ studentId: 'a', studentName: 'Ana', status: 'present' }, { studentId: 'a', studentName: 'Ana', status: 'absent' }, { studentId: 'b', studentName: 'Ben', status: 'late' }]);
  assert.equal(rows[0].name, 'Ana'); assert.equal(rows[0].total, 2); assert.equal(rows[0].rate, 0.5); assert.equal(rows[1].rate, 1);
});
test('CSV escapes quotes and commas and neutralizes spreadsheet formulas', () => {
  const csv = buildCsv([{ label: 'Name', value: (r) => r.n }], [{ n: 'Cruz, "Ana"' }, { n: '=HYPERLINK("x")' }, { n: '@cmd' }]);
  const lines = csv.replace('\ufeff', '').split('\r\n');
  assert.equal(lines[1], '"Cruz, ""Ana"""'); assert.ok(lines[2].startsWith("\"'=") || lines[2].startsWith("'=")); assert.ok(lines[3].startsWith("'@"));
});
const cls = { id: 's1', subjectCode: 'IT1', subjectName: 'Intro', instructorName: 'Cruz', room: 'R2', section: 'A', days: ['Tue'], startTime: '09:00', endTime: '10:00', status: 'active' };
test('reminders open 30 minutes before class and close at the start', () => {
  const at = (h, m) => new Date(2026, 9, 20, h, m);
  const due = (h, m) => planReminders({ schedules: [cls], uid: 'u', role: 'student', now: at(h, m) }).length;
  assert.deepEqual([due(8, 29), due(8, 30), due(8, 59), due(9, 0)], [0, 1, 1, 0]);
});
test('reminder ids are stable per occurrence and change when the time changes', () => {
  const at = new Date(2026, 9, 20, 8, 45);
  const a = planReminders({ schedules: [cls], uid: 'u', role: 'student', now: at })[0];
  const b = planReminders({ schedules: [cls], uid: 'u', role: 'student', now: new Date(2026, 9, 20, 8, 50) })[0];
  const moved = planReminders({ schedules: [{ ...cls, startTime: '09:10', endTime: '10:10' }], uid: 'u', role: 'student', now: at })[0];
  assert.equal(a.id, b.id); assert.notEqual(a.id, moved.id); assert.match(a.body, /Cruz/);
});
test('cancelled classes get no reminder but one recent cancellation notice', () => {
  const cancelled = { ...cls, status: 'cancelled', statusChangedAt: { seconds: Math.floor(new Date(2026, 9, 19).getTime() / 1000) } };
  assert.equal(planReminders({ schedules: [cancelled], uid: 'u', role: 'student', now: new Date(2026, 9, 20, 8, 45) }).length, 0);
  assert.equal(planCancellations({ schedules: [cancelled], uid: 'u', now: new Date(2026, 9, 20) }).length, 1);
  assert.equal(planCancellations({ schedules: [cancelled], uid: 'u', now: new Date(2026, 10, 20) }).length, 0);
});
test('notification preferences default to on', () => {
  assert.deepEqual(getNotificationPrefs({}), { classReminders: true, cancellations: true, browser: true });
  assert.equal(getNotificationPrefs({ preferences: { notifications: { classReminders: false } } }).classReminders, false);
});
test('account form validation and temporary passwords', () => {
  const v = { displayName: 'Ana Cruz', idNumber: '12-3-4567', role: 'student', password: 'abcdefgh' };
  assert.deepEqual(validateAccountForm(v, { isEdit: false }), {});
  assert.ok(validateAccountForm({ ...v, idNumber: '1234567' }, { isEdit: false }).idNumber);
  assert.ok(validateAccountForm({ ...v, idNumber: '' }, { isEdit: false }).idNumber);
  assert.ok(validateAccountForm({ ...v, role: 'admin' }, { isEdit: false }).role);
  assert.ok(validateAccountForm({ ...v, password: 'short' }, { isEdit: false }).password);
  const p = generateTempPassword(); assert.equal(p.length, 12); assert.doesNotMatch(p, /[0Ol1I]/);
});

import { ACTIONS, GROUPS, actionGroup, actionLabel } from '../src/lib/activityActions.js';
test('every logged action has a label and belongs to a filter group', () => {
  const groups = new Set(GROUPS.map(([id]) => id));
  Object.entries(ACTIONS).forEach(([key, a]) => { assert.ok(a.label.length > 3, key); assert.ok(groups.has(a.group), key); });
  assert.equal(actionLabel('attendance.corrected'), 'Attendance corrected'); assert.equal(actionGroup('grades.saved'), 'grades'); assert.equal(actionGroup('nope'), 'other');
});
