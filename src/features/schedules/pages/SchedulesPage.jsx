import { useCallback, useEffect, useMemo, useState } from 'react';
import ShowMore from '../../../components/ui/ShowMore.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import ScheduleForm from '../components/ScheduleForm.jsx';
import EnrollmentModal from '../components/EnrollmentModal.jsx';
import { fetchSubjects } from '../../subjects/services/subjectsService.js';
import {
  createSchedule, deleteSchedule, fetchAllSchedules, fetchPeople, migrateRosters, saveEnrollment, setScheduleStatus, updateSchedule,
} from '../services/schedulesService.js';
import { DAYS, formatDays, formatTimeRange } from '../../../lib/dateTime.js';
import { findConflicts } from '../../../lib/scheduleUtils.js';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);
  const [rows, setRows] = useState(50);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [filters, setFilters] = useState({ q: '', instructor: 'all', day: 'all', status: 'active' });
  const [form, setForm] = useState(null);
  const [enrolling, setEnrolling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [sch, sub, ins, stu] = await Promise.all([fetchAllSchedules(), fetchSubjects(), fetchPeople('instructor'), fetchPeople('student')]);
      // Schedules made before class lists moved to their own private collection are upgraded here, once.
      const legacy = sch.filter((s) => s._legacy);
      if (legacy.length) await migrateRosters(legacy).catch(() => {});
      setSchedules(sch); setSubjects(sub); setInstructors(ins); setStudents(stu);
    } catch { setLoadError('Could not load schedules. Check your connection and that the latest Firestore rules are deployed.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setRows(50); }, [filters]);

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return schedules.filter((s) =>
      (filters.status === 'all' || s.status === filters.status)
      && (filters.instructor === 'all' || s.instructorId === filters.instructor)
      && (filters.day === 'all' || s.days.includes(filters.day))
      && (!q || [s.subjectCode, s.subjectName, s.instructorName, s.room, s.section].some((v) => v?.toLowerCase().includes(q))));
  }, [schedules, filters]);

  // Instructors who appear on any schedule, so the filter lists everyone relevant (even if now inactive).
  const instructorFilter = useMemo(() => {
    const map = new Map();
    schedules.forEach((s) => map.set(s.instructorId, s.instructorName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [schedules]);

  async function handleSave(data) {
    if (form.schedule) { await updateSchedule(form.schedule.id, data); setNotice({ type: 'ok', text: 'Schedule updated.' }); }
    else { await createSchedule(data); setNotice({ type: 'ok', text: 'Schedule created. Now add its students.' }); }
    setForm(null); load();
  }

  async function handleEnrollment(chosen) {
    await saveEnrollment(enrolling, chosen);
    setNotice({ type: 'ok', text: `Enrollment saved (${chosen.length} students).` });
    setEnrolling(null); load();
  }

  async function toggleCancel(s) {
    const next = s.status === 'cancelled' ? 'active' : 'cancelled';
    if (next === 'active') {
      const clashes = findConflicts({ ...s, status: 'active' }, schedules, s.id);
      if (clashes.length) { setNotice({ type: 'error', text: `Cannot reinstate: ${clashes.join(' ')}` }); return; }
    }
    try {
      await setScheduleStatus(s, next);
      setNotice({ type: 'ok', text: next === 'cancelled' ? 'Class cancelled. Instructor and students will see it as cancelled.' : 'Class reinstated.' });
      load();
    } catch { setNotice({ type: 'error', text: 'Could not update the schedule.' }); }
  }

  async function confirmDelete() {
    setWorking(true);
    try { await deleteSchedule(deleting); setNotice({ type: 'ok', text: 'Schedule deleted.' }); setDeleting(null); load(); }
    catch { setNotice({ type: 'error', text: 'Could not delete the schedule.' }); setDeleting(null); }
    finally { setWorking(false); }
  }

  return (
    <section className="page__section">
      <div className="page__head">
        <div><h1 className="page__title">Schedules</h1>
          <p className="muted">{schedules.filter((s) => s.status === 'active').length} active classes</p></div>
        <button type="button" className="btn btn--primary" onClick={() => setForm({})}
          disabled={loading || !!loadError}>New schedule</button>
      </div>
      {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}

      <div className="toolbar toolbar--4">
        <input type="search" placeholder="Search subject, instructor, room, section" value={filters.q} onChange={setFilter('q')} aria-label="Search schedules" />
        <select value={filters.instructor} onChange={setFilter('instructor')} aria-label="Filter by instructor">
          <option value="all">All instructors</option>
          {instructorFilter.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={filters.day} onChange={setFilter('day')} aria-label="Filter by day">
          <option value="all">Any day</option>
          {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <select value={filters.status} onChange={setFilter('status')} aria-label="Filter by status">
          <option value="active">Active</option><option value="cancelled">Cancelled</option><option value="all">All</option>
        </select>
      </div>

      {loading ? <p className="muted" role="status">Loading schedules…</p>
        : loadError ? <div className="card empty"><p className="alert alert--error">{loadError}</p><button type="button" className="btn btn--ghost" onClick={load}>Try again</button></div>
        : visible.length === 0 ? (
          <div className="card empty"><p><strong>{schedules.length ? 'No schedules match your filters.' : 'No schedules yet.'}</strong></p>
            {!schedules.length && <p className="muted">{subjects.length && instructors.length ? 'Create the first class schedule.' : 'Create at least one subject and one instructor account first.'}</p>}</div>
        ) : (
          <div className="card table-card">
            <table className="table">
              <thead><tr><th>Subject</th><th>Instructor</th><th>When</th><th>Room</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visible.slice(0, rows).map((s) => (
                  <tr key={s.id}>
                    <td data-label="Subject"><strong>{s.subjectCode}</strong> {s.subjectName}{s.section && <><br /><span className="muted">{s.section}</span></>}</td>
                    <td data-label="Instructor">{s.instructorName}</td>
                    <td data-label="When">{formatDays(s.days)}<br /><span className="muted">{formatTimeRange(s.startTime, s.endTime)}</span></td>
                    <td data-label="Room">{s.room}</td>
                    <td data-label="Students">{(s.studentIds || []).length}</td>
                    <td data-label="Status"><span className={`badge badge--${s.status === 'active' ? 'ok' : 'off'}`}>{s.status === 'active' ? 'Active' : 'Cancelled'}</span></td>
                    <td data-label="Actions"><div className="rowactions">
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => setForm({ schedule: s })}>Edit</button>
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => setEnrolling(s)}>Students</button>
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => toggleCancel(s)}>{s.status === 'cancelled' ? 'Reinstate' : 'Cancel class'}</button>
                      <button type="button" className="btn btn--danger btn--small" onClick={() => setDeleting(s)}>Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ShowMore total={visible.length} shown={rows} onMore={() => setRows((n) => n + 50)} />
          </div>
        )}

      {form && <ScheduleForm schedule={form.schedule} subjects={subjects} instructors={instructors} allSchedules={schedules}
        onSubmit={handleSave} onClose={() => setForm(null)} />}
      {enrolling && <EnrollmentModal schedule={enrolling} students={students} allSchedules={schedules}
        onSave={handleEnrollment} onClose={() => setEnrolling(null)} />}
      {deleting && (
        <Modal title="Delete schedule?" onClose={() => setDeleting(null)}
          footer={<>
            <button type="button" className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" className="btn btn--danger" onClick={confirmDelete} disabled={working}>{working ? 'Deleting…' : 'Delete'}</button>
          </>}>
          <p>Delete {deleting.subjectCode} ({formatDays(deleting.days)}, {formatTimeRange(deleting.startTime, deleting.endTime)})? This removes it for the instructor and all enrolled students. To keep a record, use <strong>Cancel class</strong> instead.</p>
        </Modal>
      )}
    </section>
  );
}
