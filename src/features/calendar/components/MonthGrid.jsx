import { formatDate } from '../../../lib/dateTime.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Wide screens show class chips in each cell; narrower screens show dots so the grid never overflows.
export default function MonthGrid({ weeks, byDate, selected, today, onSelect }) {
  return (
    <div className="cal" role="group" aria-label="Month calendar">
      {WEEKDAYS.map((d) => <div key={d} className="cal__dow">{d}</div>)}
      {weeks.flat().map((cell) => {
        const classes = byDate[cell.iso] || [];
        const label = `${formatDate(cell.iso)}, ${classes.length ? `${classes.length} ${classes.length === 1 ? 'class' : 'classes'}` : 'no classes'}`;
        return (
          <button key={cell.iso} type="button" aria-label={label} aria-pressed={cell.iso === selected}
            className={`cal__day${cell.inMonth ? '' : ' is-out'}${cell.iso === today ? ' is-today' : ''}${cell.iso === selected ? ' is-selected' : ''}`}
            onClick={() => onSelect(cell.iso)}>
            <span className="cal__num">{cell.day}</span>
            {classes.length > 0 && (
              <>
                <span className="cal__dots" aria-hidden="true">
                  {classes.slice(0, 4).map((c) => <span key={c.id} className={`cal__dot${c.status === 'cancelled' ? ' cal__dot--off' : ''}`} />)}
                </span>
                <span className="cal__chips" aria-hidden="true">
                  {classes.slice(0, 2).map((c) => <span key={c.id} className={`cal__chip${c.status === 'cancelled' ? ' cal__chip--off' : ''}`}>{c.subjectCode}</span>)}
                  {classes.length > 2 && <span className="cal__more">+{classes.length - 2} more</span>}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
