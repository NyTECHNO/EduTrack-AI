import { useState } from 'react';
import { changePassword, describePasswordError } from '../services/settingsService.js';

export default function PasswordForm() {
  const [v, setV] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setOk(false);
    if (!v.current) return setError('Enter your current password.');
    if (v.next.length < 8) return setError('The new password must be at least 8 characters.');
    if (v.next === v.current) return setError('The new password must be different from the current one.');
    if (v.next !== v.confirm) return setError('The new password and its confirmation do not match.');
    setBusy(true);
    try { await changePassword(v.current, v.next); setV({ current: '', next: '', confirm: '' }); setOk(true); }
    catch (err) { setError(describePasswordError(err)); }
    finally { setBusy(false); }
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate>
      <h2 className="section-title">Change password</h2>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {ok && <p className="alert alert--ok" role="status">Password changed.</p>}
      <label className="field"><span>Current password</span><input type="password" autoComplete="current-password" value={v.current} onChange={set('current')} /></label>
      <label className="field"><span>New password</span><input type="password" autoComplete="new-password" value={v.next} onChange={set('next')} /></label>
      <label className="field"><span>Confirm new password</span><input type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} /></label>
      <div><button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Changing…' : 'Change password'}</button></div>
    </form>
  );
}
