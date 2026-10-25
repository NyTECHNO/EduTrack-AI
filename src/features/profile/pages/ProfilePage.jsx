import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { PHONE_RE, saveProfile } from '../services/profileService.js';

const ROLE_LABEL = { admin: 'Administrator', instructor: 'Instructor', student: 'Student' };

export default function ProfilePage() {
  const { user, profile, role, updateProfileState } = useAuth();
  const canEditName = role === 'admin';
  const [values, setValues] = useState({ displayName: profile.displayName || '', phone: profile.phone || '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const changed = values.phone.trim() !== (profile.phone || '') || (canEditName && values.displayName.trim() !== profile.displayName);

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (canEditName && values.displayName.trim().length < 2) found.displayName = 'Enter your full name.';
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) found.phone = 'Use 7 to 20 digits, spaces, + ( ) or -.';
    setErrors(found); setNotice(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const saved = await saveProfile({ uid: user.uid, ...values, canEditName });
      updateProfileState(saved);
      setNotice({ type: 'ok', text: 'Profile updated.' });
    } catch { setNotice({ type: 'error', text: 'Could not save. Check your connection and try again.' }); }
    finally { setBusy(false); }
  }

  const since = profile.createdAt?.toDate?.().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <section className="page__section">
      <h1 className="page__title">Profile</h1>
      <div className="profile">
        <div className="card profile__card">
          <div className="profile__avatar" aria-hidden="true">{(profile.displayName || '?').charAt(0).toUpperCase()}</div>
          <h2>{profile.displayName}</h2>
          <div className="profile__badges">
            <span className="badge badge--excused">{ROLE_LABEL[role]}</span>
            <span className={`badge badge--${profile.status === 'active' ? 'ok' : 'off'}`}>{profile.status === 'active' ? 'Active' : 'Inactive'}</span>
          </div>
        </div>

        <div className="stack">
          <div className="card stack">
            <h2 className="section-title">Account details</h2>
            <dl className="facts">
              <dt>Email</dt><dd>{profile.email}</dd>
              <dt>Role</dt><dd>{ROLE_LABEL[role]}</dd>
              <dt>Status</dt><dd>{profile.status === 'active' ? 'Active' : 'Inactive'}</dd>
              {profile.idNumber && <><dt>ID number</dt><dd>{profile.idNumber}</dd></>}
              {since && <><dt>Member since</dt><dd>{since}</dd></>}
            </dl>
            <p className="muted small">To change your name, email, ID number or role, ask the school administrator.</p>
          </div>

          <form className="card stack" onSubmit={handleSubmit} noValidate>
            <h2 className="section-title">Contact details</h2>
            {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
            <label className="field"><span>Full name</span>
              <input value={values.displayName} onChange={set('displayName')} disabled={!canEditName} maxLength={100} />
              {errors.displayName && <span className="field__error">{errors.displayName}</span>}</label>
            <label className="field"><span>Phone number</span>
              <input type="tel" inputMode="tel" value={values.phone} onChange={set('phone')} maxLength={20} autoComplete="tel" />
              {errors.phone && <span className="field__error">{errors.phone}</span>}</label>
            <div><button type="submit" className="btn btn--primary" disabled={busy || !changed}>{busy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </div>
      </div>
    </section>
  );
}
