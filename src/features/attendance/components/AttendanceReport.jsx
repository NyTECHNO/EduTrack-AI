import { useEffect, useMemo, useState } from 'react';
import { fetchScheduleRecords, fetchScheduleSessions } from '../services/attendanceService.js';
import { formatDate, formatDays, formatTimeRange } from '../../../lib/dateTime.js';
import { RATE_FORMULA, STATUS_LABEL, formatRate, rateOf, summarizeByStudent } from '../../../lib/attendanceStats.js';
import { downloadCsv } from '../../../lib/csv.js';

// Shared by instructors (their own classes, can open a session to correct it) and admins (read-only, any class).
export default function AttendanceReport({ schedules, instructorId, canEdit, onEdit }) {
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [scheduleId, setScheduleId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ records: [], sessions: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const instructors = useMemo(() => {
    const map = new Map(); schedules.forEach((s) => map.set(s.instructorId, s.instructorName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [schedules]);
  const options = schedules.filter((s) => instructorFilter === 'all' || s.instructorId === instructorFilter);
  const schedule = schedules.find((s) => s.id === scheduleId);

  useEffect(() => {
    if (!scheduleId) { setData({ records: [], sessions: [] }); return undefined; }
    let alive = true;
    setLoading(true); setError('');
    Promise.all([fetchScheduleRecords(scheduleId, instructorId), fetchScheduleSessions(scheduleId, instructorId)])
      .then(([records, sessions]) => alive && setData({ records, sessions }))
      .catch(() => alive && setError('Could not load attendance. Check your connection, and that the latest Firestore rules and indexes are deployed (indexes can take a few minutes to build).'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [scheduleId, instructorId]);

  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  const records = useMemo(() => data.records.filter((r) => inRange(r.date)), [data, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  const sessions = useMemo(() => data.sessions.filter((s) => inRange(s.date)).sort((a, b) => b.date.localeCompare(a.date)), [data, from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  const summary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summarizeByStudent(records).filter((r) => !q || r.name.toLowerCase().includes(q) || (r.idNumber || '').toLowerCase().includes(q));
  }, [records, search]);

  const overall = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };
    records.forEach((r) => { c[r.status] += 1; });
    return rateOf(c);
  }, [records]);

  const base = schedule ? `${schedule.subjectCode}-${schedule.section || 'class'}`.replace(/\s+/g, '_') : 'attendance';
  const exportSummary = () => downloadCsv(`${base}-summary.csv`, [
    { label: 'Student', value: (r) => r.name }, { label: 'ID number', value: (r) => r.idNumber },
    { label: 'Present', value: (r) => r.present }, { label: 'Absent', value: (r) => r.absent },
    { label: 'Late', value: (r) => r.late }, { label: 'Excused', value: (r) => r.excused },
    { label: 'Sessions', value: (r) => r.total }, { label: 'Attendance rate', value: (r) => formatRate(r.rate) },
  ], summary);
  const exportRecords = () => downloadCsv(`${base}-records.csv`, [
    { label: 'Date', value: (r) => r.date }, { label: 'Subject', value: (r) => r.subjectCode },
    { label: 'Instructor', value: (r) => r.instructorName }, { label: 'Student', value: (r) => r.studentName },
    { label: 'ID number', value: (r) => r.idNumber }, { label: 'Status', value: (r) => STATUS_LABEL[r.status] },
    { label: 'Remarks', value: (r) => r.remarks },
  ], [...records].sort((a, b) => a.date.localeCompare(b.date) || a.studentName.localeCompare(b.studentName)));

  return (
    <div className="stack">
      <div className={`toolbar ${instructorId ? 'toolbar--2' : 'toolbar--4'}`}>
        {!instructorId && (
          <select value={instructorFilter} onChange={(e) => { setInstructorFilter(e.target.value); setScheduleId(''); }} aria-label="Filter by instructor">
            <option value="all">All instructors</option>
            {instructors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
        <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} aria-label="Class">
          <option value="">Choose a class…</option>
          {options.map((s) => <option key={s.id} value={s.id}>{s.subjectCode} {s.section && `(${s.section}) `}· {s.instructorName} · {formatDays(s.days)} {formatTimeRange(s.startTime, s.endTime)}</option>)}
        </select>
        <label className="field field--inline"><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="field field--inline"><span>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      {!scheduleId ? <div className="card empty"><p><strong>Choose a class to see its attendance.</strong></p></div>
        : loading ? <p className="muted" role="status">Loading attendance…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : sessions.length === 0 ? <div className="card empty"><p><strong>No attendance recorded{from || to ? ' in this date range' : ' yet'}.</strong></p></div>
        : (
          <>
            <div className="statrow">
              <div className="card stat"><strong>{sessions.length}</strong><span className="muted">Sessions</span></div>
              <div className="card stat"><strong>{summary.length}</strong><span className="muted">Students</span></div>
              <div className="card stat"><strong>{formatRate(overall)}</strong><span className="muted">Overall rate</span></div>
              <div className="stat__actions">
                <button type="button" className="btn btn--ghost btn--small" onClick={exportSummary}>Export summary (CSV)</button>
                <button type="button" className="btn btn--ghost btn--small" onClick={exportRecords}>Export all records (CSV)</button>
              </div>
            </div>

            <h2 className="section-title">By student</h2>
            <input type="search" className="search-box" placeholder="Search student name or ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
            <div className="card table-card">
              <table className="table">
                <thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Rate</th></tr></thead>
                <tbody>
                  {summary.map((r) => (
                    <tr key={r.uid}>
                      <td data-label="Student"><strong>{r.name}</strong>{r.idNumber && <><br /><span className="muted">{r.idNumber}</span></>}</td>
                      <td data-label="Present">{r.present}</td><td data-label="Absent">{r.absent}</td>
                      <td data-label="Late">{r.late}</td><td data-label="Excused">{r.excused}</td>
                      <td data-label="Rate"><strong>{formatRate(r.rate)}</strong></td>
                    </tr>
                  ))}
                  {summary.length === 0 && <tr><td className="muted">No student matches.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="muted small">{RATE_FORMULA}</p>

            <h2 className="section-title">Sessions</h2>
            <div className="card table-card">
              <table className="table">
                <thead><tr><th>Date</th><th>Present</th><th>Absent</th><th>Late</th><th>Excused</th><th>Note</th>{canEdit && <th>Actions</th>}</tr></thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Date"><strong>{formatDate(s.date)}</strong></td>
                      <td data-label="Present">{s.counts?.present ?? 0}</td><td data-label="Absent">{s.counts?.absent ?? 0}</td>
                      <td data-label="Late">{s.counts?.late ?? 0}</td><td data-label="Excused">{s.counts?.excused ?? 0}</td>
                      <td data-label="Note">{s.note || '—'}</td>
                      {canEdit && <td data-label="Actions"><div className="rowactions">
                        <button type="button" className="btn btn--ghost btn--small" onClick={() => onEdit({ scheduleId: s.scheduleId, date: s.date })}>Open / correct</button></div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
    </div>
  );
}
