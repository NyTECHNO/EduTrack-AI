import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import TakeAttendance from '../components/TakeAttendance.jsx';
import AttendanceReport from '../components/AttendanceReport.jsx';
import { fetchMySchedules } from '../../schedules/services/schedulesService.js';
import { todayISO } from '../../../lib/dateTime.js';

export default function InstructorAttendance() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const preset = params.get('class'); // set by the dashboard's "Take attendance" button
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('take');
  const [target, setTarget] = useState(preset ? { scheduleId: preset, date: todayISO() } : null); // set when "Open / correct" is used in the report
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchMySchedules(user.uid, 'instructor')
      .then((s) => alive && setSchedules(s))
      .catch(() => alive && setError('Could not load your classes. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user.uid]);

  const openSession = (t) => { setTarget(t); setVersion((v) => v + 1); setTab('take'); };

  return (
    <section className="page__section">
      <h1 className="page__title">Attendance</h1>
      <div className="tabs" role="tablist" aria-label="Attendance sections">
        <button type="button" role="tab" aria-selected={tab === 'take'} className={tab === 'take' ? 'is-active' : ''} onClick={() => setTab('take')}>Take attendance</button>
        <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}>History and reports</button>
      </div>
      {loading ? <p className="muted" role="status">Loading your classes…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : tab === 'take'
          ? <TakeAttendance key={`${version}`} schedules={schedules} initial={target} />
          : <AttendanceReport schedules={schedules} instructorId={user.uid} canEdit onEdit={openSession} />}
    </section>
  );
}
