import { useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { KB_CATEGORIES } from '../../../lib/knowledgeCategories.js';

export default function EntryForm({ entry, onSubmit, onClose }) {
  const [v, setV] = useState({
    category: entry?.category || KB_CATEGORIES[0].id, title: entry?.title || '', content: entry?.content || '',
    keywords: (entry?.keywords || []).join(', '), sourceUrl: entry?.sourceUrl || '', reviewNote: entry?.reviewNote || '', status: entry?.status || 'draft',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (v.title.trim().length < 3) found.title = 'Enter a title.';
    if (v.content.trim().length < 20) found.content = 'Enter the information (at least a sentence).';
    if (v.content.length > 8000) found.content = 'Keep it under 8,000 characters. Split long topics into several entries.';
    if (v.sourceUrl.trim() && !/^https?:\/\/\S+$/i.test(v.sourceUrl.trim())) found.sourceUrl = 'Use a full link starting with http:// or https://';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true); setFormError('');
    try { await onSubmit(v); } catch (err) { setFormError(err.message || 'Could not save.'); setBusy(false); }
  }

  const err = (k) => errors[k] && <span className="field__error">{errors[k]}</span>;
  return (
    <Modal title={entry ? 'Edit entry' : 'New entry'} onClose={onClose}
      footer={<><button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="entry-form" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
      <form id="entry-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError && <p className="alert alert--error span-2" role="alert">{formError}</p>}
        <label className="field"><span>Category</span>
          <select value={v.category} onChange={set('category')}>{KB_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        <label className="field"><span>Status</span>
          <select value={v.status} onChange={set('status')}><option value="draft">Draft (chatbot ignores it)</option><option value="published">Published (chatbot can use it)</option></select></label>
        <label className="field span-2"><span>Title</span><input value={v.title} onChange={set('title')} maxLength={120} autoComplete="off" />{err('title')}</label>
        <label className="field span-2"><span>Information</span>
          <textarea rows="9" value={v.content} onChange={set('content')} />
          <small className="muted">Separate paragraphs with a blank line. Write only verified facts: the chatbot repeats this text as written.</small>{err('content')}</label>
        <label className="field span-2"><span>Keywords (optional, separated by commas)</span><input value={v.keywords} onChange={set('keywords')} placeholder="founded, 1998, tagline" autoComplete="off" /></label>
        <label className="field span-2"><span>Source link (recommended)</span><input type="url" inputMode="url" value={v.sourceUrl} onChange={set('sourceUrl')} placeholder="https://johnpaulcollege.edu.ph/…" autoComplete="off" />{err('sourceUrl')}</label>
        <label className="field span-2"><span>Internal note (only admins see this)</span><textarea rows="2" value={v.reviewNote} onChange={set('reviewNote')} /></label>
      </form>
    </Modal>
  );
}
