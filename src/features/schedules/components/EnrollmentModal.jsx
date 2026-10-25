import { useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { findStudentConflicts } from '../../../lib/scheduleUtils.js';

export default function EnrollmentModal({ schedule, students, allSchedules, onSave, onClose }) {
  // Keep already-enrolled people even if their account was deactivated since.
  const people = useMemo(() => {
    const map = new Map(students.map((s) => [s.id, { uid: s.id, name: s.displayName, idNumber: s.idNumber || '' }]));
    (schedule.enrolled || []).forEach((e) => { if (!map.has(e.uid)) map.set(e.uid, e); });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [students, schedule]);

  const [selected, setSelected] = useState(() => new Set(schedule.studentIds || []));
  const [search, setSearch] = useState('');
  const [problems, setProblems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const shown = people.filter((p) => !search.trim()
    || p.name.toLowerCase().includes(search.trim().toLowerCase()) || (p.idNumber || '').toLowerCase().includes(search.trim().toLowerCase()));
  const toggle = (uid) => setSelected((s) => { const n = new Set(s); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });

  async function handleSave() {
    const chosen = people.filter((p) => selected.has(p.uid));
    const added = chosen.filter((p) => !(schedule.studentIds || []).includes(p.uid));
    const clashes = findStudentConflicts(schedule, added, allSchedules);
    setProblems(clashes); setFormError('');
    if (clashes.length) return;
    setBusy(true);
    try { await onSave(chosen); } catch (err) { setFormError(err.message || 'Could not save.'); setBusy(false); }
  }

  return (
    <Modal title={`Students — ${schedule.subjectCode}${schedule.section ? ` (${schedule.section})` : ''}`} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={busy}>{busy ? 'Saving…' : `Save (${selected.size})`}</button>
      </>}>
      {formError && <p className="alert alert--error" role="alert">{formError}</p>}
      {problems.length > 0 && (
        <div className="alert alert--error" role="alert"><strong>Time conflict</strong>
          <ul className="conflicts">{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>
      )}
      <input type="search" className="searchfield"
        placeholder="Search name or ID number" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
      {people.length === 0 ? <p className="muted">No active students yet. Create student accounts first.</p> : (
        <ul className="check-list">
          {shown.map((p) => (
            <li key={p.uid}><label>
              <input type="checkbox" checked={selected.has(p.uid)} onChange={() => toggle(p.uid)} />
              <span><strong>{p.name}</strong>{p.idNumber && <span className="muted"> · {p.idNumber}</span>}</span>
            </label></li>
          ))}
          {shown.length === 0 && <li className="muted" style={{ padding: '.75rem' }}>No match.</li>}
        </ul>
      )}
    </Modal>
  );
}
