import { useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';

export default function SubjectForm({ subject, existing, onSubmit, onClose }) {
  const isEdit = Boolean(subject);
  const [v, setV] = useState({
    code: subject?.code || '', name: subject?.name || '',
    units: subject?.units ?? '', description: subject?.description || '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    const code = v.code.trim().toUpperCase();
    if (!code) found.code = 'Enter the subject code.';
    else if (existing.some((s) => s.code === code && s.id !== subject?.id)) found.code = 'This code is already used.';
    if (v.name.trim().length < 2) found.name = 'Enter the subject name.';
    if (v.units !== '' && !(Number(v.units) >= 0 && Number(v.units) <= 12)) found.units = 'Units must be between 0 and 12.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError('');
    try { await onSubmit(v); } catch (err) { setFormError(err.message || 'Could not save.'); setBusy(false); }
  }

  return (
    <Modal title={isEdit ? 'Edit subject' : 'New subject'} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="subject-form" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </>}>
      <form id="subject-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError && <p className="alert alert--error span-2" role="alert">{formError}</p>}
        <label className="field">
          <span>Subject code</span>
          <input value={v.code} onChange={set('code')} maxLength={20} autoComplete="off" />
          {errors.code && <span className="field__error">{errors.code}</span>}
        </label>
        <label className="field">
          <span>Units (optional)</span>
          <input type="number" min="0" max="12" step="0.5" inputMode="decimal" value={v.units} onChange={set('units')} />
          {errors.units && <span className="field__error">{errors.units}</span>}
        </label>
        <label className="field span-2">
          <span>Subject name</span>
          <input value={v.name} onChange={set('name')} maxLength={120} autoComplete="off" />
          {errors.name && <span className="field__error">{errors.name}</span>}
        </label>
        <label className="field span-2">
          <span>Description (optional)</span>
          <textarea rows="3" value={v.description} onChange={set('description')} maxLength={500} />
        </label>
      </form>
    </Modal>
  );
}
