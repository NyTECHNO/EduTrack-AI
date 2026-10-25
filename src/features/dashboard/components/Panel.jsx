import { Link } from 'react-router-dom';

// A dashboard card with its own heading, optional link, and loading/error/empty handling,
// so one slow or failed source never blanks the whole dashboard.
export default function Panel({ title, to, linkLabel = 'View all', loading, error, empty, children }) {
  return (
    <section className="card panel">
      <header className="panel__head">
        <h2 className="section-title">{title}</h2>
        {to && <Link to={to} className="panel__link">{linkLabel}</Link>}
      </header>
      {loading ? <p className="muted" role="status">Loading…</p>
        : error ? <p className="alert alert--error" role="alert">{error}</p>
        : empty ? <p className="muted">{empty}</p>
        : children}
    </section>
  );
}
