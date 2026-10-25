import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchActivityPage } from '../services/activityService.js';
import { GROUPS, actionGroup, actionLabel } from '../../../lib/activityActions.js';
import { downloadCsv } from '../../../lib/csv.js';

const when = (ts) => ts?.toDate?.().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) || '';
const dayOf = (ts) => { const d = ts?.toDate?.(); return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''; };

export default function ActivityPage() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [group, setGroup] = useState('all');
  const [who, setWho] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async (after) => {
    after ? setMore(true) : setLoading(true);
    setError('');
    try {
      const page = await fetchActivityPage({ after });
      setItems((cur) => (after ? [...cur, ...page.items] : page.items));
      setCursor(page.last); setDone(page.done);
    } catch { setError('Could not load the activity log. Check your connection and that the latest Firestore rules are deployed.'); }
    finally { setLoading(false); setMore(false); }
  }, []);
  useEffect(() => { load(null); }, [load]);

  const rows = useMemo(() => {
    const q = who.trim().toLowerCase();
    return items.filter((i) => (group === 'all' || actionGroup(i.action) === group)
      && (!q || i.actorName?.toLowerCase().includes(q) || i.summary?.toLowerCase().includes(q))
      && (!from || dayOf(i.createdAt) >= from) && (!to || dayOf(i.createdAt) <= to));
  }, [items, group, who, from, to]);

  const exportCsv = () => downloadCsv('activity-log.csv', [
    { label: 'When', value: (r) => when(r.createdAt) }, { label: 'Who', value: (r) => r.actorName }, { label: 'Role', value: (r) => r.actorRole },
    { label: 'Action', value: (r) => actionLabel(r.action) }, { label: 'Details', value: (r) => r.summary },
  ], rows);

  return (
    <section className="page__section">
      <div className="page__head">
        <div><h1 className="page__title">Activity log</h1><p className="muted">A record of important changes: who did what, and when. Entries cannot be edited or deleted.</p></div>
        {rows.length > 0 && <button type="button" className="btn btn--ghost btn--small" onClick={exportCsv}>Export (CSV)</button>}
      </div>

      <div className="toolbar toolbar--4">
        <input type="search" placeholder="Search a name or detail" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Search the log" />
        <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Filter by area">
          <option value="all">All areas</option>{GROUPS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <label className="field field--inline"><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="field field--inline"><span>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      {loading ? <p className="muted" role="status">Loading…</p>
        : error ? <div className="card empty"><p className="alert alert--error" role="alert">{error}</p><button type="button" className="btn btn--ghost" onClick={() => load(null)}>Try again</button></div>
        : items.length === 0 ? <div className="card empty"><p><strong>Nothing recorded yet.</strong></p><p className="muted">Changes made from now on appear here.</p></div>
        : (
          <>
            <div className="card table-card">
              <table className="table">
                <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td data-label="When">{when(r.createdAt)}</td>
                      <td data-label="Who"><strong>{r.actorName}</strong><br /><span className="muted">{r.actorRole}</span></td>
                      <td data-label="Action"><span className="badge badge--excused">{actionLabel(r.action)}</span></td>
                      <td data-label="Details">{r.summary}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td className="muted">Nothing matches your filters among the {items.length} loaded entries.</td></tr>}
                </tbody>
              </table>
              {!done && (
                <div className="showmore"><button type="button" className="btn btn--ghost btn--small" onClick={() => load(cursor)} disabled={more}>{more ? 'Loading…' : 'Load older entries'}</button></div>
              )}
            </div>
            <p className="muted small">Filters apply to the {items.length} entries loaded so far. Load older entries to search further back.</p>
          </>
        )}
    </section>
  );
}
