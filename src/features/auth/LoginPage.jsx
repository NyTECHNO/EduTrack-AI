import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logos/jpc-logo.png';
import { signIn, describeAuthError } from '../../firebase/auth.js';
import { isFirebaseConfigured } from '../../firebase/firebase.js';
import { useAuth } from './AuthContext.jsx';
import './login.css';

export default function LoginPage() {
  const { user, loading, error: accountError, clearError } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    clearError();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(describeAuthError(err));
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
          <p className="login__hint">Use the email and password given to you by the school.</p>

          {!isFirebaseConfigured && (
            <p className="alert alert--warn" role="alert">
              Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill in your project values.
            </p>
          )}
          {message && <p className="alert alert--error" role="alert">{message}</p>}

          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="username" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy || !isFirebaseConfigured}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="login__footnote">Accounts are created by the school administrator. There is no public sign-up.</p>
        </form>
      </section>
    </main>
  );
}
