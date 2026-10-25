import ShowMore from '../../../components/ui/ShowMore.jsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SubjectForm from '../components/SubjectForm.jsx';
import { createSubject, fetchSubjects, setSubjectStatus, updateSubject } from '../services/subjectsService.js';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [rows, setRows] = useState(50);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { setSubjects(await fetchSubjects()); }
    catch { setLoadError('Could not load subjects. Check your connection and that the latest Firestore rules are deployed.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setRows(50); }, [search, status]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((s) => (status === 'all' || s.status === status)
      && (!q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)));
  }, [subjects, search, status]);

  async function handleSave(values) {
    if (form.subject) { await updateSubject(form.subject.id, values); setNotice({ type: 'ok', text: 'Subject updated.' }); }
    else { await createSubject(values); setNotice({ type: 'ok', text: 'Subject created.' }); }
    setForm(null); load();
  }

  async function toggle(subject) {
    const next = subject.status === 'active' ? 'archived' : 'active';
    try {
      await setSubjectStatus(subject, next);
      setNotice({ type: 'ok', text: next === 'archived' ? 'Subject archived. Existing schedules keep it.' : 'Subject restored.' });
      load();
    } catch { setNotice({ type: 'error', text: 'Could not update the subject.' }); }
  }

  return (
    <section className="page__section">
      <div className="page__head">
        <div><h1 className="page__title">Subjects</h1><p className="muted">{subjects.filter((s) => s.status === 'active').length} active subjects</p></div>
        <button type="button" className="btn btn--primary" onClick={() => setForm({})}>New subject</button>
      </div>
      {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      <div className="toolbar toolbar--2">
        <input type="search" placeholder="Search code or name" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search subjects" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option>
        </select>
      </div>

      {loading ? <p className="muted" role="status">Loading subjects…</p>
        : loadError ? <div className="card empty"><p className="alert alert--error">{loadError}</p><button type="button" className="btn btn--ghost" onClick={load}>Try again</button></div>
        : visible.length === 0 ? <div className="card empty"><p><strong>{subjects.length ? 'No subjects match.' : 'No subjects yet.'}</strong></p>{!subjects.length && <p className="muted">Create the first subject, then schedule it.</p>}</div>
        : (
          <div className="card table-card">
            <table className="table">
              <thead><tr><th>Code</th><th>Name</th><th>Units</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visible.slice(0, rows).map((s) => (
                  <tr key={s.id}>
                    <td data-label="Code"><strong>{s.code}</strong></td>
                    <td data-label="Name">{s.name}{s.description && <><br /><span className="muted">{s.description}</span></>}</td>
                    <td data-label="Units">{s.units ?? '—'}</td>
                    <td data-label="Status"><span className={`badge badge--${s.status === 'active' ? 'ok' : 'off'}`}>{s.status === 'active' ? 'Active' : 'Archived'}</span></td>
                    <td data-label="Actions"><div className="rowactions">
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => setForm({ subject: s })}>Edit</button>
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => toggle(s)}>{s.status === 'active' ? 'Archive' : 'Restore'}</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ShowMore total={visible.length} shown={rows} onMore={() => setRows((n) => n + 50)} />
          </div>
        )}
      {form && <SubjectForm subject={form.subject} existing={subjects} onSubmit={handleSave} onClose={() => setForm(null)} />}
    </section>
  );
}
