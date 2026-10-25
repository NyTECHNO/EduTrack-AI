import ClassLine from '../../schedules/components/ClassLine.jsx';
import { formatTimeRange } from '../../../lib/dateTime.js';

// Students see the required "Instructor | Subject | Time | Room" line; staff see what matters to them.
export default function CalendarClass({ cls, role }) {
  const cancelled = cls.status === 'cancelled';
  return (
    <li className={`card classcard${cancelled ? ' classcard--off' : ''}`}>
      {cancelled && <span className="badge badge--off">Cancelled</span>}
      {role === 'student' ? <ClassLine schedule={cls} /> : (
        <>
          <p className="classline"><strong>{cls.subjectCode} {cls.subjectName}</strong></p>
          <p className="classline">
            {formatTimeRange(cls.startTime, cls.endTime)}<span className="sep">|</span>{cls.room}
            {cls.section && <><span className="sep">|</span>{cls.section}</>}
            {role === 'admin' && <><span className="sep">|</span>{cls.instructorName}</>}
          </p>
        </>
      )}
    </li>
  );
}
