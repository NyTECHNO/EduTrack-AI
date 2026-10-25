import ClassLine from '../../schedules/components/ClassLine.jsx';
import { formatTimeRange } from '../../../lib/dateTime.js';

const STATE = { cancelled: ['Cancelled', 'off'], done: ['Done', 'off'], ongoing: ['In progress', 'ok'], upcoming: ['Upcoming', 'excused'] };

// One class on the dashboard. Students get the required Instructor | Subject | Time | Room line.
export default function DashboardClass({ occ, role, children }) {
  const s = occ.schedule;
  const [label, tone] = STATE[occ.state];
  return (
    <li className={`classrow${occ.state === 'done' || occ.state === 'cancelled' ? ' classrow--off' : ''}`}>
      <div className="classrow__main">
        {role === 'student' ? <ClassLine schedule={s} /> : (
          <>
            <p className="classline"><strong>{s.subjectCode} {s.subjectName}</strong></p>
            <p className="classline">{formatTimeRange(s.startTime, s.endTime)}<span className="sep">|</span>{s.room}
              {role === 'admin' ? <><span className="sep">|</span>{s.instructorName}</> : s.section ? <><span className="sep">|</span>{s.section}</> : null}</p>
          </>
        )}
      </div>
      <div className="classrow__side"><span className={`badge badge--${tone}`}>{label}</span>{children}</div>
    </li>
  );
}
