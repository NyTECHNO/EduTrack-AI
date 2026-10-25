import { useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';

export default function AssessmentForm({ assessment, categories, onSubmit, onClose }) {
  const [v, setV] = useState({
    title: assessment?.title || '', category: assessment?.category || categories[0]?.id || '', maxScore: assessment ? String(assessment.maxScore) : '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    const max = Number(v.maxScore);
    if (!v.title.trim()) found.title = 'Enter a title, for example Quiz 1.';
    if (!categories.some((c) => c.id === v.category)) found.category = 'Choose a category.';
    if (v.maxScore.trim() === '' || !Number.isFinite(max) || max <= 0 || max > 10000) found.maxScore = 'Enter the highest possible score (more than 0).';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true); setFormError('');
    try { await onSubmit({ title: v.title.trim(), category: v.category, maxScore: max }); }
    catch (err) { setFormError(err.message || 'Could not save.'); setBusy(false); }
  }

  return (
    <Modal title={assessment ? 'Edit assessment' : 'New assessment'} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="assessment-form" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      <form id="assessment-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError && <p className="alert alert--error span-2" role="alert">{formError}</p>}
        <label className="field span-2"><span>Title</span><input value={v.title} onChange={set('title')} maxLength={60} autoComplete="off" />{errors.title && <span className="field__error">{errors.title}</span>}</label>
        <label className="field"><span>Category</span>
          <select value={v.category} onChange={set('category')}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {errors.category && <span className="field__error">{errors.category}</span>}</label>
        <label className="field"><span>Highest possible score</span><input inputMode="decimal" value={v.maxScore} onChange={set('maxScore')} />{errors.maxScore && <span className="field__error">{errors.maxScore}</span>}</label>
      </form>
    </Modal>
  );
}
