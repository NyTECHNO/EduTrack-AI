import { useEffect, useState } from 'react';
import AttendanceReport from '../components/AttendanceReport.jsx';
import { fetchAllSchedules } from '../../schedules/services/schedulesService.js';

// Admins oversee attendance (read-only); only instructors change records.
export default function AdminAttendance() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchAllSchedules()
      .then((s) => alive && setSchedules(s))
      .catch(() => alive && setError('Could not load classes. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <section className="page__section">
      <h1 className="page__title">Attendance reports</h1>
      <p className="muted">Review and export attendance for any class. Records are read-only here.</p>
      {loading ? <p className="muted" role="status">Loading classes…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : <AttendanceReport schedules={schedules} canEdit={false} />}
    </section>
  );
}
