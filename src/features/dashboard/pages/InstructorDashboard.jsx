import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import Panel from '../components/Panel.jsx';
import DashboardClass from '../components/DashboardClass.jsx';
import NextClassCard from '../components/NextClassCard.jsx';
import useMySchedules from '../hooks/useMySchedules.js';
import { fetchSession } from '../../attendance/services/attendanceService.js';
import { useNotifications } from '../../reminders/NotificationsProvider.jsx';
import { occurrencesOn, upcomingOccurrences, whenLabel } from '../../../lib/classTimes.js';
import { formatDate, formatTime, todayISO } from '../../../lib/dateTime.js';
import { LEAD_MINUTES } from '../../reminders/lib/reminderPlanner.js';
import useNow from '../../../hooks/useNow.js';

export default function InstructorDashboard() {
  const { user, profile } = useAuth();
  const { items, unread } = useNotifications();
  const now = useNow();
  const { loading, schedules, error } = useMySchedules(user.uid, 'instructor');
  const today = todayISO();

  const todays = useMemo(() => occurrencesOn(today, schedules, now), [today, schedules, now]);
  const upcoming = useMemo(() => upcomingOccurrences(schedules, now, { days: 7, limit: 6 }), [schedules, now]);
  const next = upcoming[0];
  const later = upcoming.filter((o) => o.date !== today || o.state === 'upcoming').slice(0, 5);

  // Has attendance already been taken for today's classes?
  const [taken, setTaken] = useState({});
  const todayKey = todays.filter((o) => o.state !== 'cancelled').map((o) => o.schedule.id).join(',');
  useEffect(() => {
    let alive = true;
    const ids = todayKey ? todayKey.split(',') : [];
    Promise.all(ids.map((id) => fetchSession(id, today).then((s) => [id, Boolean(s)]).catch(() => [id, null])))
      .then((pairs) => alive && setTaken(Object.fromEntries(pairs)));
    return () => { alive = false; };
  }, [todayKey, today]);

  const studentCount = schedules.filter((s) => s.status === 'active').reduce((n, s) => n + (s.studentIds || []).length, 0);

  return (
    <section className="page__section">
      <h1 className="page__title">Welcome, {profile.displayName}</h1>
      <p className="muted">{formatDate(today)}</p>
      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <div className="dash">
        <NextClassCard occ={next} role="instructor" now={now} loading={loading} />

        <Panel title="Today’s classes" to="/calendar" linkLabel="Calendar" loading={loading} empty={todays.length === 0 ? 'You have no classes today.' : ''}>
          <ul className="classrows">
            {todays.map((o) => (
              <DashboardClass key={o.key} occ={o} role="instructor">
                {o.state !== 'cancelled' && taken[o.schedule.id] === true && <span className="badge badge--ok">Attendance taken</span>}
                {o.state !== 'cancelled' && taken[o.schedule.id] === false && o.state !== 'upcoming' && (
                  <Link className="btn btn--primary btn--small" to={`/attendance?class=${o.schedule.id}`}>Take attendance</Link>)}
              </DashboardClass>
            ))}
          </ul>
        </Panel>

        <Panel title="Upcoming classes and reminders" to="/my-schedule" linkLabel="My schedule" loading={loading} empty={later.length === 0 ? 'No more classes in the next 7 days.' : ''}>
          <ul className="classrows">
            {later.map((o) => (
              <DashboardClass key={o.key} occ={o} role="instructor">
                <span className="small muted">{whenLabel(o, now)}</span>
                <span className="small muted">Reminder {formatTime(new Date(o.start.getTime() - LEAD_MINUTES * 60000).toTimeString().slice(0, 5))}</span>
              </DashboardClass>
            ))}
          </ul>
          <p className="muted small">{unread ? `${unread} unread notification${unread === 1 ? '' : 's'}. Open the bell to read them.` : 'No unread notifications.'}</p>
        </Panel>

        <Panel title="Students">
          <p><strong>{studentCount}</strong> enrolments across {schedules.filter((s) => s.status === 'active').length} active classes.</p>
          <p className="muted small">Open <Link to="/my-schedule">My schedule</Link> to see each class’s enrolled students.</p>
        </Panel>

        <Panel title="Quick actions">
          <div className="actions">
            <Link className="btn btn--primary" to="/attendance">Attendance</Link>
            <Link className="btn btn--ghost" to="/grades">Grades</Link>
            <Link className="btn btn--ghost" to="/calendar">Calendar</Link>
            <Link className="btn btn--ghost" to="/chatbot">School assistant</Link>
          </div>
          {items.length > 0 && <p className="muted small">Latest: {items[0].title}</p>}
        </Panel>
      </div>
    </section>
  );
}
