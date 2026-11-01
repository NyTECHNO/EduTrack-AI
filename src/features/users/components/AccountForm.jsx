import { useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { validateAccountForm } from '../../../lib/validators.js';
import { generateTempPassword } from '../../../lib/password.js';
import { ID_EXAMPLE, formatIdInput, isIdEmail } from '../../../lib/studentId.js';

export default function AccountForm({ account, onSubmit, onClose }) {
  const isEdit = Boolean(account);
  const idLocked = isEdit && isIdEmail(account.email); // an ID account signs in with its ID, so the ID cannot change
  const [values, setValues] = useState({
    displayName: account?.displayName || '',
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
          <span>ID number</span>
          <input value={values.idNumber} inputMode="numeric" placeholder={ID_EXAMPLE} maxLength={9} autoComplete="off"
            disabled={idLocked} onChange={(e) => setValues((v) => ({ ...v, idNumber: isEdit ? e.target.value : formatIdInput(e.target.value) }))} />
          <small className="muted">{idLocked ? 'The ID number is used to sign in, so it cannot be changed.' : `Used to sign in. Format ${ID_EXAMPLE}. It cannot be changed later.`}</small>
          {errors.idNumber && <span className="field__error">{errors.idNumber}</span>}
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
            <small className="muted">You will see this once after creating the account. It is never stored. The person can change it in Settings.</small>
          </div>
        )}
      </form>
    </Modal>
  );
}
