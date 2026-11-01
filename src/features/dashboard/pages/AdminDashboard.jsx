import { profileName } from '../../../lib/profile.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import Panel from '../components/Panel.jsx';
import DashboardClass from '../components/DashboardClass.jsx';
import { fetchAdminStats, fetchRecentSessions } from '../services/dashboardService.js';
import { fetchAllSchedules, migrateRosters } from '../../schedules/services/schedulesService.js';
import { fetchSettings } from '../../grades/services/gradesService.js';
import { fetchActivityPage } from '../../activity/services/activityService.js';
import { actionLabel } from '../../../lib/activityActions.js';
import { occurrencesOn } from '../../../lib/classTimes.js';
import { formatDate, todayISO } from '../../../lib/dateTime.js';
import useNow from '../../../hooks/useNow.js';

const useLoad = (fn, deps = []) => {
  const [s, setS] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setS({ loading: false, data, error: '' }))
      .catch(() => alive && setS({ loading: false, data: null, error: 'Could not load this section. Check your connection and the deployed rules.' }));
    return () => { alive = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return s;
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const now = useNow();
  const stats = useLoad(fetchAdminStats);
  const schedules = useLoad(async () => {
    const list = await fetchAllSchedules();
    migrateRosters(list.filter((s) => s._legacy)).catch(() => {}); // one-time privacy upgrade of older schedules
    return list;
  });
  const recent = useLoad(fetchRecentSessions);
  const grading = useLoad(fetchSettings);
  const activity = useLoad(() => fetchActivityPage({ size: 5 }));

  const today = todayISO();
  const todays = schedules.data ? occurrencesOn(today, schedules.data, now) : [];
  const st = stats.data;

  const tiles = [
    { label: 'Active students', value: st?.students, to: '/accounts' },
    { label: 'Active instructors', value: st?.instructors, to: '/accounts' },
    { label: 'Active subjects', value: st?.subjects, to: '/subjects' },
    { label: 'Active classes', value: st?.classes, to: '/schedules' },
  ];

  return (
    <section className="page__section">
      <h1 className="page__title">Welcome, {profileName(profile)}</h1>
      <p className="muted">{formatDate(today)}</p>

      {(grading.data === null && !grading.loading && !grading.error) && (
        <p className="alert alert--warn">Grading is not set up yet, so instructors cannot use the gradebook. <Link to="/grading-settings">Set up grading</Link></p>
      )}
      {st?.drafts > 0 && <p className="alert alert--warn">{st.drafts} school information {st.drafts === 1 ? 'entry is' : 'entries are'} still drafts and not used by the chatbot. <Link to="/school-info">Review them</Link></p>}
      {stats.error && <p className="alert alert--error" role="alert">{stats.error}</p>}

      <div className="statrow">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="card stat stat--link"><strong>{stats.loading ? '…' : t.value ?? '—'}</strong><span className="muted">{t.label}</span></Link>
        ))}
      </div>

      <div className="dash">
        <Panel title="Today’s classes" to="/schedules" linkLabel="Manage schedules" loading={schedules.loading} error={schedules.error}
          empty={todays.length === 0 ? 'No classes are scheduled today.' : ''}>
          <ul className="classrows">{todays.slice(0, 8).map((o) => <DashboardClass key={o.key} occ={o} role="admin" />)}</ul>
          {todays.length > 8 && <p className="muted small">+ {todays.length - 8} more. See Calendar.</p>}
        </Panel>

        <Panel title="Recent attendance" to="/attendance" linkLabel="Reports" loading={recent.loading} error={recent.error}
          empty={recent.data?.length === 0 ? 'No attendance has been recorded yet.' : ''}>
          <ul className="classrows">
            {recent.data?.map((s) => (
              <li key={s.id} className="classrow">
                <div className="classrow__main"><p className="classline"><strong>{s.subjectCode}</strong><span className="sep">|</span>{formatDate(s.date)}</p>
                  <p className="classline muted">{s.instructorName}</p></div>
                <div className="classrow__side small">P {s.counts?.present ?? 0} · A {s.counts?.absent ?? 0} · L {s.counts?.late ?? 0} · E {s.counts?.excused ?? 0}</div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent activity" to="/activity" linkLabel="Activity log" loading={activity.loading} error={activity.error}
          empty={activity.data?.items.length === 0 ? 'Nothing recorded yet. Changes made from now on appear here.' : ''}>
          <ul className="classrows">
            {activity.data?.items.map((a) => (
              <li key={a.id} className="classrow">
                <div className="classrow__main"><p className="classline"><strong>{actionLabel(a.action)}</strong></p><p className="classline muted">{a.summary}</p></div>
                <div className="classrow__side small muted">{a.actorName}</div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Quick actions">
          <div className="actions">
            <Link className="btn btn--primary" to="/accounts">Create an account</Link>
            <Link className="btn btn--ghost" to="/subjects">Subjects</Link>
            <Link className="btn btn--ghost" to="/schedules">Schedules</Link>
            <Link className="btn btn--ghost" to="/attendance">Attendance reports</Link>
            <Link className="btn btn--ghost" to="/grades">Grade reports</Link>
            <Link className="btn btn--ghost" to="/school-info">School information</Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}
