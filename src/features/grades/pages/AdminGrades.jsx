import { useEffect, useMemo, useState } from 'react';
import { fetchAllSchedules } from '../../schedules/services/schedulesService.js';
import { fetchScheduleGrades } from '../services/gradesService.js';
import { formatGrade } from '../../../lib/gradeCalculator.js';
import { formatDays, formatTimeRange } from '../../../lib/dateTime.js';
import { downloadCsv } from '../../../lib/csv.js';

// Admins oversee grades (read-only). Instructors are the only ones who change them.
export default function AdminGrades({ settings }) {
  const [schedules, setSchedules] = useState([]);
  const [instructor, setInstructor] = useState('all');
  const [scheduleId, setScheduleId] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchAllSchedules().then(setSchedules).catch(() => setError('Could not load classes.')); }, []);
  useEffect(() => {
    if (!scheduleId) { setGrades([]); return undefined; }
    let alive = true;
    setLoading(true); setError('');
    fetchScheduleGrades(scheduleId).then((g) => alive && setGrades(g))
      .catch(() => alive && setError('Could not load grades. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [scheduleId]);

  const instructors = useMemo(() => {
    const map = new Map(); schedules.forEach((s) => map.set(s.instructorId, s.instructorName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [schedules]);
  const options = schedules.filter((s) => instructor === 'all' || s.instructorId === instructor);

  const { periods, students } = useMemo(() => {
    const order = (settings?.periods || []).map((p) => p.id);
    const periodMap = new Map(); const studentMap = new Map();
    grades.forEach((g) => {
      periodMap.set(g.periodId, g.periodName);
      const row = studentMap.get(g.studentId) || { id: g.studentId, name: g.studentName, idNumber: g.idNumber, byPeriod: {} };
      row.byPeriod[g.periodId] = g; studentMap.set(g.studentId, row);
    });
    return {
      periods: [...periodMap.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])),
      students: [...studentMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [grades, settings]);

  const exportCsv = () => downloadCsv('grades.csv', [
    { label: 'Student', value: (r) => r.name }, { label: 'ID number', value: (r) => r.idNumber },
    ...periods.flatMap(([id, name]) => [
      { label: name, value: (r) => (r.byPeriod[id]?.final ? formatGrade(r.byPeriod[id].final.value, settings) : '') },
      { label: `${name} status`, value: (r) => r.byPeriod[id]?.final?.status || '' },
    ]),
  ], students);

  return (
    <section className="page__section">
      <h1 className="page__title">Grade reports</h1>
      <p className="muted">Review the grades of any class. Records are read-only here.</p>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      <div className="toolbar toolbar--2">
        <select value={instructor} onChange={(e) => { setInstructor(e.target.value); setScheduleId(''); }} aria-label="Filter by instructor">
          <option value="all">All instructors</option>{instructors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} aria-label="Class">
          <option value="">Choose a class…</option>
          {options.map((s) => <option key={s.id} value={s.id}>{s.subjectCode} {s.section && `(${s.section}) `}· {s.instructorName} · {formatDays(s.days)} {formatTimeRange(s.startTime, s.endTime)}</option>)}
        </select>
      </div>
      {!scheduleId ? <div className="card empty"><p><strong>Choose a class to see its grades.</strong></p></div>
        : loading ? <p className="muted" role="status">Loading grades…</p>
        : students.length === 0 ? <div className="card empty"><p><strong>No grades recorded for this class yet.</strong></p></div>
        : (
          <>
            <div><button type="button" className="btn btn--ghost btn--small" onClick={exportCsv}>Export (CSV)</button></div>
            <div className="card table-card scroll-x">
              <table className="table table--grid">
                <thead><tr><th>Student</th>{periods.map(([id, name]) => <th key={id}>{name}</th>)}</tr></thead>
                <tbody>
                  {students.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.name}</strong>{r.idNumber && <><br /><span className="muted">{r.idNumber}</span></>}</td>
                      {periods.map(([id]) => {
                        const f = r.byPeriod[id]?.final;
                        return <td key={id}>{f ? <><strong>{formatGrade(f.value, settings)}</strong> <span className={`badge badge--${f.status === 'passed' ? 'present' : 'absent'}`}>{f.status === 'passed' ? 'Passed' : 'Failed'}</span></> : '—'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
    </section>
  );
}
