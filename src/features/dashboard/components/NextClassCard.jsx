import { formatDays, formatTimeRange } from '../../../lib/dateTime.js';
import { whenLabel } from '../../../lib/classTimes.js';

export default function NextClassCard({ occ, role, now, loading }) {
  return (
    <section className="card nextcard" aria-label="Next class">
      <p className="nextcard__label">Next class</p>
      {loading ? <p>Loading…</p> : !occ ? <p className="nextcard__none">No classes in the next 7 days.</p> : (
        <>
          <p className="nextcard__when">{whenLabel(occ, now)}</p>
          <h2 className="nextcard__title">{occ.schedule.subjectCode} {occ.schedule.subjectName}</h2>
          <p className="nextcard__meta">{formatTimeRange(occ.schedule.startTime, occ.schedule.endTime)} · <strong>Room {occ.schedule.room}</strong></p>
          <p className="nextcard__meta">{role === 'student' ? occ.schedule.instructorName : [occ.schedule.section, `${(occ.schedule.enrolled || []).length} students`].filter(Boolean).join(' · ')} · {formatDays(occ.schedule.days)}</p>
        </>
      )}
    </section>
  );
}
