import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { fetchMyRecords } from '../services/attendanceService.js';
import { RATE_FORMULA, STATUSES, STATUS_LABEL, formatRate, summarizeBySubject } from '../../../lib/attendanceStats.js';
import { formatDate } from '../../../lib/dateTime.js';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let alive = true;
    fetchMyRecords(user.uid)
      .then((r) => alive && setRecords(r))
      .catch(() => alive && setError('Could not load your attendance. Check your connection, and try again in a few minutes if the school just updated the system.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user.uid]);

  const subjects = useMemo(() => summarizeBySubject(records), [records]);
  const rows = useMemo(() => records
    .filter((r) => (subject === 'all' || r.scheduleId === subject) && (status === 'all' || r.status === status))
    .sort((a, b) => b.date.localeCompare(a.date)), [records, subject, status]);

  return (
    <section className="page__section">
      <h1 className="page__title">My attendance</h1>
      <p className="muted">Your attendance records. Only your instructor can change them.</p>
      {loading ? <p className="muted" role="status">Loading your attendance…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : records.length === 0 ? <div className="card empty"><p><strong>No attendance recorded yet.</strong></p><p className="muted">Records appear after your instructor takes attendance.</p></div>
        : (
          <>
            <ul className="classes">
              {subjects.map((s) => (
                <li key={s.scheduleId} className="card classcard">
                  <p className="classline"><strong>{s.subjectCode} {s.subjectName}</strong></p>
                  <small>{s.instructorName}</small>
                  <p className="classline"><strong>{formatRate(s.rate)}</strong> attendance</p>
                  <small>Present {s.present} · Absent {s.absent} · Late {s.late} · Excused {s.excused}</small>
                </li>
              ))}
            </ul>
            <p className="muted small">{RATE_FORMULA}</p>

            <div className="toolbar toolbar--2">
              <select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Filter by subject">
                <option value="all">All subjects</option>
                {subjects.map((s) => <option key={s.scheduleId} value={s.scheduleId}>{s.subjectCode} {s.subjectName}</option>)}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                <option value="all">Any status</option>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="card table-card">
              <table className="table">
                <thead><tr><th>Date</th><th>Subject</th><th>Instructor</th><th>Status</th><th>Remarks</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Date">{formatDate(r.date)}</td>
                      <td data-label="Subject">{r.subjectCode} {r.subjectName}</td>
                      <td data-label="Instructor">{r.instructorName}</td>
                      <td data-label="Status"><span className={`badge badge--${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                      <td data-label="Remarks">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td className="muted">No records match.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
    </section>
  );
}
