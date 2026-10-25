import { useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { validateAccountForm } from '../../../lib/validators.js';
import { generateTempPassword } from '../../../lib/password.js';

export default function AccountForm({ account, onSubmit, onClose }) {
  const isEdit = Boolean(account);
  const [values, setValues] = useState({
    displayName: account?.displayName || '',
    email: account?.email || '',
    role: account?.role || 'student',
    idNumber: account?.idNumber || '',
    phone: account?.phone || '',
    password: isEdit ? '' : generateTempPassword(),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateAccountForm(values, { isEdit });
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit account' : 'New account'} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="account-form" className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
        </button>
      </>}>
      <form id="account-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError && <p className="alert alert--error span-2" role="alert">{formError}</p>}

        <label className="field span-2">
          <span>Full name</span>
          <input value={values.displayName} onChange={set('displayName')} autoComplete="off" maxLength={100} />
          {errors.displayName && <span className="field__error">{errors.displayName}</span>}
        </label>

        <label className="field span-2">
          <span>Email</span>
          <input type="email" value={values.email} onChange={set('email')} disabled={isEdit} autoComplete="off" />
          {errors.email && <span className="field__error">{errors.email}</span>}
        </label>

        <label className="field">
          <span>Role</span>
          <select value={values.role} onChange={set('role')}>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
          {errors.role && <span className="field__error">{errors.role}</span>}
        </label>

        <label className="field">
          <span>ID number (optional)</span>
          <input value={values.idNumber} onChange={set('idNumber')} maxLength={40} autoComplete="off" />
        </label>

        <label className="field span-2">
          <span>Phone (optional)</span>
          <input type="tel" value={values.phone} onChange={set('phone')} maxLength={30} autoComplete="off" />
        </label>

        {!isEdit && (
          <div className="field span-2">
            <label htmlFor="temp-pw">Temporary password</label>
            <div className="inline">
              <input id="temp-pw" value={values.password} onChange={set('password')} autoComplete="off" spellCheck="false" />
              <button type="button" className="btn btn--ghost" onClick={() => setValues((v) => ({ ...v, password: generateTempPassword() }))}>
                Generate
              </button>
            </div>
            {errors.password && <span className="field__error">{errors.password}</span>}
            <small className="muted">You will see this once after creating the account. It is never stored.</small>
          </div>
        )}
      </form>
    </Modal>
  );
}
