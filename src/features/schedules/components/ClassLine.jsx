import { formatTimeRange } from '../../../lib/dateTime.js';

// Required student format: Instructor | Subject | Time | Room
export default function ClassLine({ schedule }) {
  return (
    <p className="classline">
      <strong>{schedule.instructorName}</strong><span className="sep">|</span>
      {schedule.subjectCode} {schedule.subjectName}<span className="sep">|</span>
      {formatTimeRange(schedule.startTime, schedule.endTime)}<span className="sep">|</span>
      {schedule.room}
    </p>
  );
}
