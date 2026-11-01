import { useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';

// The Instructor picks more students (from the classes they teach) to invite to a group chat.
export default function InviteModal({ title, candidates, onInvite, onClose }) {
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const shown = useMemo(() => candidates.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.idNumber || '').toLowerCase().includes(q);
  }), [candidates, search]);
  const toggle = (uid) => setSelected((s) => { const n = new Set(s); if (n.has(uid)) n.delete(uid); else n.add(uid); return n; });

  async function save() {
    setBusy(true); setError('');
    try { await onInvite([...selected]); } catch { setError('Could not send the invitations. Please try again.'); setBusy(false); }
  }

  return (
    <Modal title={`Invite students — ${title}`} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={save} disabled={busy || selected.size === 0}>{busy ? 'Inviting…' : `Invite (${selected.size})`}</button>
      </>}>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {candidates.length === 0 ? <p className="muted">Everyone from your classes has already been invited or has joined.</p> : (
        <>
          <input type="search" className="searchfield" placeholder="Search name or ID number" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
          <ul className="check-list">
            {shown.map((p) => (
              <li key={p.uid}><label>
                <input type="checkbox" checked={selected.has(p.uid)} onChange={() => toggle(p.uid)} />
                <span><strong>{p.name}</strong>{p.idNumber && <span className="muted"> · {p.idNumber}</span>}<span className="muted small"> {p.classes.join(', ')}</span></span>
              </label></li>
            ))}
            {shown.length === 0 && <li className="muted" style={{ padding: '.75rem' }}>No match.</li>}
          </ul>
        </>
      )}
    </Modal>
  );
}
