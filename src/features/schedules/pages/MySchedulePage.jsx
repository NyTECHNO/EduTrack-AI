import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import ClassLine from '../components/ClassLine.jsx';
import { fetchMySchedules } from '../services/schedulesService.js';
import { DAYS, formatTimeRange } from '../../../lib/dateTime.js';

export default function MySchedulePage() {
  const { user, role } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchMySchedules(user.uid, role)
      .then((s) => alive && setSchedules(s))
      .catch(() => alive && setError('Could not load your schedule. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user.uid, role]);

  const byDay = useMemo(() => DAYS
    .map((d) => ({ ...d, items: schedules.filter((s) => s.days.includes(d.key)).sort((a, b) => a.startTime.localeCompare(b.startTime)) }))
    .filter((d) => d.items.length), [schedules]);

  return (
    <section className="page__section">
      <h1 className="page__title">My schedule</h1>
      <p className="muted">{role === 'instructor' ? 'Classes you teach, with your enrolled students.' : 'Your enrolled classes: Instructor | Subject | Time | Room.'}</p>
      {loading ? <p className="muted" role="status">Loading your schedule…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : byDay.length === 0 ? (
          <div className="card empty"><p><strong>No classes yet.</strong></p>
            <p className="muted">{role === 'instructor' ? 'Classes appear here once the administrator assigns them to you.' : 'Classes appear here once the administrator enrolls you.'}</p></div>
        ) : byDay.map((day) => (
          <div className="daygroup" key={day.key}>
            <h2>{day.label}</h2>
            <ul className="classes">
              {day.items.map((s) => (
                <li key={s.id} className={`card classcard${s.status === 'cancelled' ? ' classcard--off' : ''}`}>
                  {s.status === 'cancelled' && <span className="badge badge--off">Cancelled</span>}
                  {role === 'student' ? <ClassLine schedule={s} /> : (
                    <>
                      <p className="classline"><strong>{s.subjectCode} {s.subjectName}</strong></p>
                      <p className="classline">{formatTimeRange(s.startTime, s.endTime)}<span className="sep">|</span>{s.room}{s.section && <><span className="sep">|</span>{s.section}</>}</p>
                      <details>
                        <summary>{(s.enrolled || []).length} enrolled students</summary>
                        {(s.enrolled || []).length ? <ul>{s.enrolled.map((e) => <li key={e.uid}>{e.name}{e.idNumber && <small> · {e.idNumber}</small>}</li>)}</ul> : <small>No students enrolled yet.</small>}
                      </details>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
