import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import Icon from '../../../components/ui/Icon.jsx';
import MonthGrid from '../components/MonthGrid.jsx';
import CalendarClass from '../components/CalendarClass.jsx';
import { fetchAllSchedules, fetchMySchedules } from '../../schedules/services/schedulesService.js';
import { classesOn, monthGrid, toISO } from '../../../lib/calendarUtils.js';
import { formatDate, todayISO } from '../../../lib/dateTime.js';
import useMediaQuery from '../../../hooks/useMediaQuery.js';

const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

export default function CalendarPage() {
  const { user, role } = useAuth();
  const isSmall = useMediaQuery('(max-width: 47.99rem)');
  const today = todayISO();
  const now = new Date();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(today);
  const [viewPref, setViewPref] = useState(null); // null = choose by screen size
  const [instructor, setInstructor] = useState('all');
  const view = viewPref ?? (isSmall ? 'agenda' : 'month');

  // Admins load every class; instructors and students load only their own (the rules enforce this too).
  useEffect(() => {
    let alive = true;
    (role === 'admin' ? fetchAllSchedules() : fetchMySchedules(user.uid, role))
      .then((s) => alive && setSchedules(s))
      .catch(() => alive && setError('Could not load the calendar. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user.uid, role]);

  const instructors = useMemo(() => {
    const map = new Map(); schedules.forEach((s) => map.set(s.instructorId, s.instructorName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [schedules]);
  const visible = useMemo(() => schedules.filter((s) => instructor === 'all' || s.instructorId === instructor), [schedules, instructor]);

  const weeks = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const byDate = useMemo(() => Object.fromEntries(weeks.flat().map((c) => [c.iso, classesOn(c.iso, visible)])), [weeks, visible]);
  const agendaDays = weeks.flat().filter((c) => c.inMonth && byDate[c.iso].length);

  function go(delta) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    const y = d.getFullYear(); const m = d.getMonth();
    setCursor({ y, m });
    setSelected(today.startsWith(toISO(y, m, 1).slice(0, 7)) ? today : toISO(y, m, 1));
  }
  const goToday = () => { setCursor({ y: now.getFullYear(), m: now.getMonth() }); setSelected(today); };

  const selectedClasses = byDate[selected] || classesOn(selected, visible);

  return (
    <section className="page__section">
      <h1 className="page__title">Calendar</h1>
      {loading ? <p className="muted" role="status">Loading calendar…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : schedules.length === 0 ? (
          <div className="card empty"><p><strong>No classes to show yet.</strong></p>
            <p className="muted">{role === 'admin' ? 'Create schedules and they appear here.' : 'Your classes appear here once the administrator schedules them.'}</p></div>
        ) : (
          <>
            <div className="calbar">
              <div className="calbar__nav">
                <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous month"><Icon name="chevronLeft" /></button>
                <h2 className="calbar__title" aria-live="polite">{monthLabel(cursor.y, cursor.m)}</h2>
                <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next month"><Icon name="chevronRight" /></button>
                <button type="button" className="btn btn--ghost btn--small" onClick={goToday}>Today</button>
              </div>
              <div className="calbar__tools">
                {role === 'admin' && (
                  <select value={instructor} onChange={(e) => setInstructor(e.target.value)} aria-label="Filter by instructor" className="calbar__select">
                    <option value="all">All instructors</option>{instructors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                )}
                <div className="tabs" role="tablist" aria-label="Calendar view">
                  {[['month', 'Month'], ['agenda', 'Agenda']].map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={view === key} className={view === key ? 'is-active' : ''} onClick={() => setViewPref(key)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {view === 'month' ? (
              <div className="calwrap">
                <MonthGrid weeks={weeks} byDate={byDate} selected={selected} today={today} onSelect={setSelected} />
                <aside className="card stack" aria-label="Selected date">
                  <h2 className="section-title">{formatDate(selected)}</h2>
                  {selectedClasses.length === 0 ? <p className="muted">No classes on this day.</p>
                    : <ul className="classes classes--single">{selectedClasses.map((c) => <CalendarClass key={c.id} cls={c} role={role} />)}</ul>}
                </aside>
              </div>
            ) : agendaDays.length === 0 ? (
              <div className="card empty"><p><strong>No classes in {monthLabel(cursor.y, cursor.m)}.</strong></p></div>
            ) : agendaDays.map((c) => (
              <div className="daygroup" key={c.iso}>
                <h2 className={c.iso === today ? 'is-today-title' : ''}>{formatDate(c.iso)}{c.iso === today && ' · Today'}</h2>
                <ul className="classes">{byDate[c.iso].map((cls) => <CalendarClass key={cls.id} cls={cls} role={role} />)}</ul>
              </div>
            ))}
          </>
        )}
    </section>
  );
}
