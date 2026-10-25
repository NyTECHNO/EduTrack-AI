export const STATUSES = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'late', label: 'Late' },
  { key: 'excused', label: 'Excused' },
];
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]));

// ATTENDANCE-RATE POLICY (confirm with the school): Present and Late count as attended,
// and Excused sessions are left out of the rate. Change these two lists to change the policy everywhere.
const ATTENDED = ['present', 'late'];
const LEFT_OUT = ['excused'];
export const RATE_FORMULA = 'Rate = (Present + Late) ÷ (all sessions − Excused)';

export function rateOf(counts) {
  const denominator = counts.total - LEFT_OUT.reduce((n, k) => n + counts[k], 0);
  if (denominator <= 0) return null;
  return ATTENDED.reduce((n, k) => n + counts[k], 0) / denominator;
}
export const formatRate = (rate) => (rate == null ? '—' : `${Math.round(rate * 1000) / 10}%`);

const emptyCounts = () => ({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });
function tally(map, key, seed, record) {
  const row = map.get(key) || { ...seed, ...emptyCounts() };
  row[record.status] += 1;
  row.total += 1;
  map.set(key, row);
}

export function summarizeByStudent(records) {
  const map = new Map();
  records.forEach((r) => tally(map, r.studentId, { uid: r.studentId, name: r.studentName, idNumber: r.idNumber }, r));
  return [...map.values()].map((r) => ({ ...r, rate: rateOf(r) })).sort((a, b) => a.name.localeCompare(b.name));
}

export function summarizeBySubject(records) {
  const map = new Map();
  records.forEach((r) => tally(map, r.scheduleId, { scheduleId: r.scheduleId, subjectCode: r.subjectCode, subjectName: r.subjectName, instructorName: r.instructorName }, r));
  return [...map.values()].map((r) => ({ ...r, rate: rateOf(r) })).sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
}
