import { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { fetchContacts } from '../services/messagesService.js';

// Admins pick an Instructor; Instructors pick an Admin. Students never see this.
export default function NewMessageModal({ role, onPick, onClose }) {
  const [contacts, setContacts] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const target = role === 'admin' ? 'instructor' : 'administrator';

  useEffect(() => {
    let live = true;
    fetchContacts(role).then((list) => live && setContacts(list)).catch(() => live && setError('Could not load the list. Check your connection and try again.'));
    return () => { live = false; };
  }, [role]);

  const shown = useMemo(() => (contacts || []).filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())), [contacts, search]);

  async function choose(contact) {
    setBusy(true); setError('');
    try { await onPick(contact); } catch { setError('Could not open the conversation. Please try again.'); setBusy(false); }
  }

  return (
    <Modal title={`Message an ${target}`} onClose={onClose}>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {contacts === null && !error && <p className="muted">Loading…</p>}
      {contacts && contacts.length === 0 && <p className="muted">No active {target} accounts found.</p>}
      {contacts && contacts.length > 0 && (
        <>
          <input type="search" className="searchfield" placeholder={`Search ${target}s`} value={search} onChange={(e) => setSearch(e.target.value)} aria-label={`Search ${target}s`} />
          <ul className="check-list">
            {shown.map((c) => (
              <li key={c.uid}>
                <button type="button" className="pick" disabled={busy} onClick={() => choose(c)}>{c.name}</button>
              </li>
            ))}
            {shown.length === 0 && <li className="muted" style={{ padding: '.75rem' }}>No match.</li>}
          </ul>
        </>
      )}
    </Modal>
  );
}
