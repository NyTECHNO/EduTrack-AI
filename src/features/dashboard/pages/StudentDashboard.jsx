import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import Panel from '../components/Panel.jsx';
import DashboardClass from '../components/DashboardClass.jsx';
import NextClassCard from '../components/NextClassCard.jsx';
import useMySchedules from '../hooks/useMySchedules.js';
import { fetchMyRecords } from '../../attendance/services/attendanceService.js';
import { fetchMyGrades, fetchSettings } from '../../grades/services/gradesService.js';
import { useNotifications } from '../../reminders/NotificationsProvider.jsx';
import { occurrencesOn, upcomingOccurrences, whenLabel } from '../../../lib/classTimes.js';
import { formatDate, todayISO } from '../../../lib/dateTime.js';
import { formatRate, rateOf } from '../../../lib/attendanceStats.js';
import { formatGrade } from '../../../lib/gradeCalculator.js';
import useNow from '../../../hooks/useNow.js';

function useLoad(fn, dep) {
  const [s, setS] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setS({ loading: false, data, error: '' }))
      .catch(() => alive && setS({ loading: false, data: null, error: 'Could not load this section. Try again in a moment.' }));
    return () => { alive = false; };
  }, [dep]); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
}

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { items, unread } = useNotifications();
  const now = useNow();
  const { loading, schedules, error } = useMySchedules(user.uid, 'student');
  const attendance = useLoad(() => fetchMyRecords(user.uid), user.uid);
  const grades = useLoad(async () => ({ docs: await fetchMyGrades(user.uid), settings: await fetchSettings().catch(() => null) }), user.uid);
  const today = todayISO();

  const todays = useMemo(() => occurrencesOn(today, schedules, now), [today, schedules, now]);
  const upcoming = useMemo(() => upcomingOccurrences(schedules, now, { days: 7, limit: 8 }), [schedules, now]);
  const next = upcoming[0];
  const later = upcoming.filter((o) => o !== next || o.state === 'upcoming').slice(1, 6);

  const att = useMemo(() => {
    if (!attendance.data?.length) return null;
    const c = { present: 0, absent: 0, late: 0, excused: 0, total: attendance.data.length };
    attendance.data.forEach((r) => { c[r.status] += 1; });
    return { ...c, rate: rateOf(c) };
  }, [attendance.data]);

  // Latest graded period per subject.
  const gradeRows = useMemo(() => {
    if (!grades.data) return [];
    const order = (grades.data.settings?.periods || []).map((p) => p.id);
    const best = new Map();
    grades.data.docs.filter((g) => g.final).forEach((g) => {
      const cur = best.get(g.scheduleId);
      if (!cur || order.indexOf(g.periodId) > order.indexOf(cur.periodId)) best.set(g.scheduleId, g);
    });
    return [...best.values()].sort((a, b) => a.subjectCode.localeCompare(b.subjectCode)).slice(0, 6);
  }, [grades.data]);

  return (
    <section className="page__section">
      <h1 className="page__title">Welcome, {profile.displayName}</h1>
      <p className="muted">{formatDate(today)}</p>
      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <div className="dash">
        <NextClassCard occ={next} role="student" now={now} loading={loading} />

        <Panel title="Today’s classes" to="/calendar" linkLabel="Calendar" loading={loading} empty={todays.length === 0 ? 'You have no classes today.' : ''}>
          <ul className="classrows">{todays.map((o) => <DashboardClass key={o.key} occ={o} role="student" />)}</ul>
        </Panel>

        <Panel title="Upcoming schedule" to="/my-schedule" linkLabel="Full schedule" loading={loading} empty={later.length === 0 ? 'No more classes in the next 7 days.' : ''}>
          <ul className="classrows">{later.map((o) => <DashboardClass key={o.key} occ={o} role="student"><span className="small muted">{whenLabel(o, now)}</span></DashboardClass>)}</ul>
        </Panel>

        <Panel title="Attendance" to="/attendance" linkLabel="Details" loading={attendance.loading} error={attendance.error} empty={!att ? 'No attendance recorded yet.' : ''}>
          {att && (
            <>
              <p className="bignum">{formatRate(att.rate)}</p>
              <div className="meter" role="img" aria-label={`Attendance rate ${formatRate(att.rate)}`}><span style={{ width: `${Math.round((att.rate || 0) * 100)}%` }} /></div>
              <p className="muted small">Present {att.present} · Absent {att.absent} · Late {att.late} · Excused {att.excused}</p>
            </>
          )}
        </Panel>

        <Panel title="Latest grades" to="/grades" linkLabel="All grades" loading={grades.loading} error={grades.error} empty={gradeRows.length === 0 ? 'No grades posted yet.' : ''}>
          <ul className="classrows">
            {gradeRows.map((g) => (
              <li key={g.id} className="classrow">
                <div className="classrow__main"><p className="classline"><strong>{g.subjectCode}</strong> {g.subjectName}</p><p className="classline muted">{g.periodName}</p></div>
                <div className="classrow__side"><strong>{formatGrade(g.final.value, grades.data.settings)}</strong>
                  <span className={`badge badge--${g.final.status === 'passed' ? 'present' : 'absent'}`}>{g.final.status === 'passed' ? 'Passed' : 'Failed'}</span></div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Notifications" empty={items.length === 0 ? 'No notifications yet. Class reminders appear 30 minutes before each class.' : ''}>
          <ul className="classrows">
            {items.slice(0, 3).map((n) => (
              <li key={n.id} className="classrow"><div className="classrow__main"><p className="classline"><strong>{n.title}</strong></p><p className="classline muted">{n.body}</p></div></li>
            ))}
          </ul>
          <p className="muted small">{unread ? `${unread} unread. Open the bell to read them.` : 'You are up to date.'}</p>
        </Panel>

        <Panel title="School assistant">
          <p>Ask about the college’s history, mission, values and programs.</p>
          <div className="actions"><Link className="btn btn--primary" to="/chatbot">Open assistant</Link></div>
        </Panel>
      </div>
    </section>
  );
}
