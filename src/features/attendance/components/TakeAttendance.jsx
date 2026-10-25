import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import StatusPicker from './StatusPicker.jsx';
import { fetchSession, fetchSessionRecords, saveAttendance } from '../services/attendanceService.js';
import { formatDate, formatDays, formatTimeRange, todayISO, weekdayKey } from '../../../lib/dateTime.js';
import { STATUSES } from '../../../lib/attendanceStats.js';

export default function TakeAttendance({ schedules, initial }) {
  const { user, profile } = useAuth();
  const usable = useMemo(() => schedules.filter((s) => s.status === 'active'), [schedules]);
  const [scheduleId, setScheduleId] = useState(initial?.scheduleId || usable[0]?.id || '');
  const [date, setDate] = useState(initial?.date || todayISO());
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({});
  const [note, setNote] = useState('');
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const schedule = usable.find((s) => s.id === scheduleId);

  // Load the roster, plus any attendance already saved for this class and date.
  useEffect(() => {
    if (!schedule || !date) return undefined;
    let alive = true;
    setLoading(true); setMessage(null);
    (async () => {
      try {
        const session = await fetchSession(schedule.id, date);
        const records = session ? await fetchSessionRecords(session.id) : [];
        if (!alive) return;
        // Current enrollment, plus anyone who already has a record (kept if they were removed later).
        const people = new Map((schedule.enrolled || []).map((e) => [e.uid, e]));
        records.forEach((r) => { if (!people.has(r.studentId)) people.set(r.studentId, { uid: r.studentId, name: r.studentName, idNumber: r.idNumber }); });
        setRoster([...people.values()].sort((a, b) => a.name.localeCompare(b.name)));
        setMarks(Object.fromEntries(records.map((r) => [r.studentId, { status: r.status, remarks: r.remarks || '' }])));
        setNote(session?.note || '');
        setExists(Boolean(session));
      } catch {
        if (alive) setMessage({ type: 'error', text: 'Could not load this class. Check your connection and that the latest Firestore rules are deployed.' });
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [schedule, date]);

  const setStatus = (uid, status) => setMarks((m) => ({ ...m, [uid]: { remarks: '', ...m[uid], status } }));
  const setRemarks = (uid, remarks) => setMarks((m) => ({ ...m, [uid]: { ...m[uid], remarks } }));
  const markAll = (status) => setMarks(Object.fromEntries(roster.map((p) => [p.uid, { remarks: marks[p.uid]?.remarks || '', status }])));

  const unmarked = roster.filter((p) => !marks[p.uid]?.status).length;
  const counts = STATUSES.map((s) => ({ ...s, n: roster.filter((p) => marks[p.uid]?.status === s.key).length }));
  const offDay = schedule && date && !schedule.days.includes(weekdayKey(date));

  async function handleSave() {
    if (!roster.length) return;
    if (unmarked) { setMessage({ type: 'error', text: `Mark every student before saving (${unmarked} left).` }); return; }
    setSaving(true); setMessage(null);
    try {
      await saveAttendance({ schedule, instructor: { uid: user.uid, name: profile.displayName }, date, note, roster, marks, exists });
      setExists(true);
      setMessage({ type: 'ok', text: exists ? 'Attendance corrected.' : 'Attendance saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Could not save. Nothing is lost: press Save again to retry.' });
    } finally { setSaving(false); }
  }

  if (!usable.length) {
    return <div className="card empty"><p><strong>No active classes assigned to you.</strong></p><p className="muted">Classes appear here once the administrator assigns them.</p></div>;
  }

  return (
    <div className="stack">
      <div className="toolbar toolbar--2">
        <label className="field"><span>Class</span>
          <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            {usable.map((s) => <option key={s.id} value={s.id}>{s.subjectCode} {s.section && `(${s.section}) `}· {formatDays(s.days)} {formatTimeRange(s.startTime, s.endTime)}</option>)}
          </select></label>
        <label className="field"><span>Date</span>
          <input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
      </div>

      {offDay && <p className="alert alert--warn">{formatDate(date)} is not a regular class day ({formatDays(schedule.days)}). You can still record it, for example for a make-up class.</p>}
      {exists && <p className="alert alert--warn">Attendance for this class on {formatDate(date)} already exists. Changes you save will correct it.</p>}
      {message && <p className={`alert alert--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      {loading ? <p className="muted" role="status">Loading class…</p>
        : roster.length === 0 ? <div className="card empty"><p><strong>No students enrolled in this class.</strong></p><p className="muted">Ask the administrator to enroll students.</p></div>
        : (
          <div className="card table-card">
            <div className="roster__bar">
              <strong>{roster.length} students</strong>
              <span className="muted">{counts.map((c) => `${c.label} ${c.n}`).join(' · ')}{unmarked ? ` · Unmarked ${unmarked}` : ''}</span>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => markAll('present')}>Mark all present</button>
            </div>
            <ul className="roster">
              {roster.map((p) => (
                <li key={p.uid} className="roster__row">
                  <div><strong>{p.name}</strong>{p.idNumber && <><br /><span className="muted">{p.idNumber}</span></>}</div>
                  <StatusPicker name={`status-${p.uid}`} label={`Attendance for ${p.name}`} value={marks[p.uid]?.status} onChange={(s) => setStatus(p.uid, s)} />
                  <input className="roster__remarks" placeholder="Remarks (optional)" maxLength={200} aria-label={`Remarks for ${p.name}`}
                    value={marks[p.uid]?.remarks || ''} onChange={(e) => setRemarks(p.uid, e.target.value)} />
                </li>
              ))}
            </ul>
            <div className="roster__foot">
              <input className="roster__remarks" placeholder="Session note (optional)" maxLength={200} aria-label="Session note" value={note} onChange={(e) => setNote(e.target.value)} />
              <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : exists ? 'Save correction' : 'Save attendance'}</button>
            </div>
          </div>
        )}
    </div>
  );
}
