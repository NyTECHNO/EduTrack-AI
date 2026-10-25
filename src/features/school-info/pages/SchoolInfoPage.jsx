import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import EntryForm from '../components/EntryForm.jsx';
import { deleteEntry, fetchKnowledge, importDrafts, saveEntry, setEntryStatus } from '../services/knowledgeService.js';
import { SUGGESTED_DRAFTS, SUPERSEDED_IDS } from '../data/suggestedDrafts.js';
import { KB_CATEGORIES, categoryLabel } from '../../../lib/knowledgeCategories.js';

export default function SchoolInfoPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { setEntries((await fetchKnowledge({ includeDrafts: true })).sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))); }
    catch { setLoadError('Could not load the school information. Check your connection and that the latest Firestore rules are deployed.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => entries.filter((e) => (category === 'all' || e.category === category) && (status === 'all' || e.status === status)), [entries, category, status]);
  const emptyCategories = KB_CATEGORIES.filter((c) => !entries.some((e) => e.category === c.id && e.status === 'published'));
  const missingSuggested = SUGGESTED_DRAFTS.filter((d) => !entries.some((e) => e.id === d.id)).length;

  async function handleSave(values) {
    await saveEntry(form.entry?.id, values, user.uid);
    setNotice({ type: 'ok', text: form.entry ? 'Entry updated.' : 'Entry created.' });
    setForm(null); load();
  }
  async function toggle(entry) {
    const next = entry.status === 'published' ? 'draft' : 'published';
    try { await setEntryStatus(entry, next, user.uid); setNotice({ type: 'ok', text: next === 'published' ? 'Published. The chatbot can now use it.' : 'Unpublished. The chatbot no longer uses it.' }); load(); }
    catch { setNotice({ type: 'error', text: 'Could not change the status.' }); }
  }
  async function confirmDelete() {
    try { await deleteEntry(deleting); setNotice({ type: 'ok', text: 'Entry deleted.' }); } catch { setNotice({ type: 'error', text: 'Could not delete the entry.' }); }
    setDeleting(null); load();
  }
  async function handleImport(publish) {
    setImporting(true);
    try {
      const { added, replaced } = await importDrafts(SUGGESTED_DRAFTS, entries.map((e) => e.id), user.uid, { publish, supersededIds: SUPERSEDED_IDS });
      setNotice({ type: 'ok', text: `${added} entries added${publish ? ' and published' : ' as drafts'}.${replaced ? ` ${replaced} older entry was replaced and moved to drafts: delete it when you are ready.` : ''}` });
      load();
    } catch { setNotice({ type: 'error', text: 'Could not import the entries.' }); }
    finally { setImporting(false); setConfirmImport(false); }
  }

  return (
    <section className="page__section">
      <div className="page__head">
        <div><h1 className="page__title">School information</h1><p className="muted">The chatbot answers only from published entries on this page.</p></div>
        <div className="inline">
          {missingSuggested > 0 && <button type="button" className="btn btn--ghost" onClick={() => setConfirmImport(true)}>Add website information ({missingSuggested})</button>}
          <button type="button" className="btn btn--primary" onClick={() => setForm({})}>New entry</button>
        </div>
      </div>

      {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      {!loading && !loadError && emptyCategories.length > 0 && (
        <p className="alert alert--warn">Nothing is published yet for: {emptyCategories.map((c) => c.label).join(', ')}. The chatbot will say that information isn’t available.</p>
      )}

      <div className="toolbar toolbar--2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>{KB_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">Any status</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
      </div>

      {loading ? <p className="muted" role="status">Loading…</p>
        : loadError ? <div className="card empty"><p className="alert alert--error">{loadError}</p><button type="button" className="btn btn--ghost" onClick={load}>Try again</button></div>
        : visible.length === 0 ? <div className="card empty"><p><strong>{entries.length ? 'No entries match.' : 'No entries yet.'}</strong></p>
            {!entries.length && <p className="muted">Add the information gathered from the school website, or create your own entries.</p>}</div>
        : (
          <div className="card table-card">
            <table className="table">
              <thead><tr><th>Entry</th><th>Status</th><th>Source</th><th>Actions</th></tr></thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Entry"><strong>{e.title}</strong><br /><span className="muted">{categoryLabel(e.category)}</span>
                      {e.reviewNote && <><br /><span className="note">Needs review: {e.reviewNote}</span></>}</td>
                    <td data-label="Status"><span className={`badge badge--${e.status === 'published' ? 'ok' : 'off'}`}>{e.status === 'published' ? 'Published' : 'Draft'}</span></td>
                    <td data-label="Source">{e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">Open source</a> : '—'}</td>
                    <td data-label="Actions"><div className="rowactions">
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => setForm({ entry: e })}>Edit</button>
                      <button type="button" className="btn btn--ghost btn--small" onClick={() => toggle(e)}>{e.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                      <button type="button" className="btn btn--danger btn--small" onClick={() => setDeleting(e)}>Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {form && <EntryForm entry={form.entry} onSubmit={handleSave} onClose={() => setForm(null)} />}
      {deleting && (
        <Modal title="Delete entry?" onClose={() => setDeleting(null)}
          footer={<><button type="button" className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancel</button><button type="button" className="btn btn--danger" onClick={confirmDelete}>Delete</button></>}>
          <p>Delete “{deleting.title}”? The chatbot will stop using it. To keep it for later, use <strong>Unpublish</strong> instead.</p>
        </Modal>
      )}
      {confirmImport && (
        <Modal title="Add information from the school website" onClose={() => setConfirmImport(false)}
          footer={<>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmImport(false)}>Cancel</button>
            <button type="button" className="btn btn--ghost" onClick={() => handleImport(false)} disabled={importing}>Add as drafts</button>
            <button type="button" className="btn btn--primary" onClick={() => handleImport(true)} disabled={importing}>{importing ? 'Adding…' : 'Add and publish'}</button>
          </>}>
          <p>This adds <strong>{missingSuggested}</strong> entries covering history, background, programs (pre-elementary to college and TESDA), admissions, contact details, community programs and the school’s offices. They are <strong>paraphrased</strong> from johnpaulcollege.edu.ph, and each keeps its source link.</p>
          <p><strong>Add and publish</strong> lets the chatbot use them right away. <strong>Add as drafts</strong> lets you read and edit each one first. Entries marked “Needs review” point out figures or names to double-check either way.</p>
        </Modal>
      )}
    </section>
  );
}
