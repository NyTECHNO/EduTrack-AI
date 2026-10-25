import { formatGrade } from '../../../lib/gradeCalculator.js';

// Shows exactly how a computed grade was reached.
export default function BreakdownTable({ computed, settings }) {
  if (!computed) return <p className="muted">No scores have been entered yet.</p>;
  return (
    <div className="breakdown">
      <table className="table table--grid">
        <thead><tr><th>Category</th><th>Weight</th><th>Score</th><th>Percent</th></tr></thead>
        <tbody>
          {computed.breakdown.map((b) => (
            <tr key={b.categoryId} className={b.included ? '' : 'is-muted'}>
              <td><strong>{b.name}</strong>
                {b.items.length > 0 && <ul className="breakdown__items">{b.items.map((i) => <li key={i.id}>{i.title}: {i.score == null ? 'no score' : `${i.score}/${i.max}`}</li>)}</ul>}</td>
              <td>{b.weight}%</td>
              <td>{b.possible > 0 ? `${b.earned}/${b.possible}` : '—'}</td>
              <td>{b.percent == null ? 'Not counted' : `${b.percent.toFixed(2)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Percentage: {computed.percentage}%</strong>{computed.grade != null && <> · <strong>Grade: {formatGrade(computed.grade, settings)}</strong></>}</p>
      {computed.reason === 'no-conversion' && <p className="alert alert--warn">This scale needs a conversion table before a grade can be computed. Ask the administrator.</p>}
      <p className="muted small">Categories with nothing graded yet are left out and the other weights are rescaled to 100%.</p>
    </div>
  );
}
