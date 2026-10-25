import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import BreakdownTable from '../components/BreakdownTable.jsx';
import { fetchMyGrades } from '../services/gradesService.js';
import { formatGrade } from '../../../lib/gradeCalculator.js';

const STATUS = { passed: 'Passed', failed: 'Failed' };

export default function StudentGrades({ settings }) {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchMyGrades(user.uid)
      .then((g) => alive && setGrades(g))
      .catch(() => alive && setError('Could not load your grades. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user.uid]);

  const subjects = useMemo(() => {
    const map = new Map();
    grades.forEach((g) => {
      const entry = map.get(g.scheduleId) || { scheduleId: g.scheduleId, subjectCode: g.subjectCode, subjectName: g.subjectName, instructorName: g.instructorName, rows: [] };
      entry.rows.push(g); map.set(g.scheduleId, entry);
    });
    const order = (settings?.periods || []).map((p) => p.id);
    return [...map.values()].sort((a, b) => a.subjectCode.localeCompare(b.subjectCode))
      .map((s) => ({ ...s, rows: s.rows.sort((a, b) => order.indexOf(a.periodId) - order.indexOf(b.periodId)) }));
  }, [grades, settings]);

  return (
    <section className="page__section">
      <h1 className="page__title">My grades</h1>
      <p className="muted">Your grades by subject and grading period. Only your instructor can change them.</p>
      {loading ? <p className="muted" role="status">Loading your grades…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : subjects.length === 0 ? <div className="card empty"><p><strong>No grades posted yet.</strong></p><p className="muted">Grades appear here after your instructor records them.</p></div>
        : subjects.map((s) => (
          <div className="card stack" key={s.scheduleId}>
            <div><strong>{s.subjectCode} {s.subjectName}</strong><br /><span className="muted">{s.instructorName}</span></div>
            <table className="table">
              <thead><tr><th>Period</th><th>Grade</th><th>Status</th><th>Method</th><th>Remarks</th></tr></thead>
              <tbody>
                {s.rows.map((g) => (
                  <tr key={g.id}>
                    <td data-label="Period">{g.periodName}</td>
                    <td data-label="Grade"><strong>{g.final ? formatGrade(g.final.value, settings) : '—'}</strong></td>
                    <td data-label="Status">{g.final ? <span className={`badge badge--${g.final.status === 'passed' ? 'present' : 'absent'}`}>{STATUS[g.final.status]}</span> : <span className="badge badge--off">Not graded</span>}</td>
                    <td data-label="Method">{g.method === 'manual' ? 'Entered by instructor' : 'Computed from scores'}</td>
                    <td data-label="Remarks">{g.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {s.rows.filter((g) => g.method === 'computed' && g.computed).map((g) => (
              <details key={g.id}><summary>{g.periodName}: how this grade was computed</summary><BreakdownTable computed={g.computed} settings={settings} /></details>
            ))}
          </div>
        ))}
    </section>
  );
}
