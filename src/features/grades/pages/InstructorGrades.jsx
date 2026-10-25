import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import InstructorGradebook from '../components/InstructorGradebook.jsx';
import { fetchMySchedules } from '../../schedules/services/schedulesService.js';

export default function InstructorGrades({ settings }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchMySchedules(user.uid, 'instructor').then((s) => alive && setSchedules(s))
      .catch(() => alive && setError('Could not load your classes. Check your connection and try again.'));
    return () => { alive = false; };
  }, [user.uid]);

  return (
    <section className="page__section">
      <h1 className="page__title">Grades</h1>
      {error ? <p className="alert alert--error" role="alert">{error}</p>
        : !schedules ? <p className="muted" role="status">Loading your classes…</p>
        : schedules.length === 0 ? <div className="card empty"><p><strong>No classes assigned to you yet.</strong></p></div>
        : <InstructorGradebook schedules={schedules} settings={settings} />}
    </section>
  );
}
