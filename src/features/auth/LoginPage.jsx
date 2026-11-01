import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logos/jpc-logo.png';
import { signIn, signInWithId, describeAuthError } from '../../firebase/auth.js';
import { isFirebaseConfigured } from '../../firebase/firebase.js';
import { ALLOW_EMAIL_LOGIN, ID_EXAMPLE, formatIdInput, isValidId } from '../../lib/studentId.js';
import { useAuth } from './AuthContext.jsx';
import './login.css';

export default function LoginPage() {
  const { user, loading, error: accountError, clearError } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('id'); // 'id' (normal) or 'email' (older accounts only)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const switchMode = (next) => { setMode(next); setIdentifier(''); setError(''); clearError(); };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    clearError();
    if (mode === 'id' && !isValidId(identifier)) { setError(`Enter your ID number as ${ID_EXAMPLE}.`); return; }
    if (mode === 'email' && !identifier.trim()) { setError('Enter your email.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    setBusy(true);
    try {
      await (mode === 'id' ? signInWithId(identifier, password) : signIn(identifier, password));
    } catch (err) {
      setError(describeAuthError(err, mode));
    } finally {
      setBusy(false);
    }
  }

  const message = error || accountError;

  return (
    <main className="login">
      <section className="login__brand" aria-label="John Paul College">
        <img className="login__logo" src={logo} alt="John Paul College seal, Roxas, Oriental Mindoro, 1998" />
        <h1 className="login__college">JOHN PAUL COLLEGE</h1>
        <p className="login__system">EduTrack AI</p>
        <p className="login__motto">The future starts today, not tomorrow.</p>
      </section>

      <section className="login__panel">
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <h2>Sign in</h2>
          <p className="login__hint">Use the ID number and password given to you by the school.</p>

          {!isFirebaseConfigured && (
            <p className="alert alert--warn" role="alert">
              Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill in your project values.
            </p>
          )}
          {message && <p className="alert alert--error" role="alert">{message}</p>}

          {mode === 'id' ? (
            <label className="field">
              <span>ID number</span>
              <input value={identifier} onChange={(e) => setIdentifier(formatIdInput(e.target.value))} inputMode="numeric"
                autoComplete="username" placeholder={ID_EXAMPLE} maxLength={9} required />
              <span className="field__hint">Format: {ID_EXAMPLE}</span>
            </label>
          ) : (
            <label className="field">
              <span>Email</span>
              <input type="email" autoComplete="username" inputMode="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </label>
          )}
          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy || !isFirebaseConfigured}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {ALLOW_EMAIL_LOGIN && (
            <p className="login__alt">
              <button type="button" className="linkbtn" onClick={() => switchMode(mode === 'id' ? 'email' : 'id')}>
                {mode === 'id' ? 'Older account? Sign in with email' : 'Use my ID number instead'}
              </button>
            </p>
          )}
          <p className="login__footnote">Accounts are created by the school administrator. There is no public sign-up.</p>
        </form>
      </section>
    </main>
  );
}
