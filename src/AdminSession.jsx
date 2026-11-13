import { signOutWithNotifications } from './notifications/notificationService';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { AlertCircle, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { auth, firebaseConfigured } from './firebase';
import './AdminSession.css';
export default function AdminSession({ children }) {
  const [ready, setReady] = useState(false), [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    if (!auth) return;
    let active = true;
    const stop = onAuthStateChanged(auth, async user => {
      setAllowed(false);
      try {
        const token = user ? await user.getIdTokenResult() : null;
        if (!active) return;
        setAllowed(token?.claims.admin === true);
        if (user && token?.claims.admin !== true) setError('This account does not have administrator access.');
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setReady(true); }
    });
    return () => { active = false; stop(); };
  }, []);
  if (allowed) return children;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <aside className="admin-login-intro" aria-label="SkyConnect workspace">
          <div className="admin-login-brand">
            <img src="/logo.png" alt="" width="44" height="44" />
            <div><strong>SkyConnect<span>SL</span></strong><small>TRAVEL DISCOVERY</small></div>
          </div>
          <div className="admin-login-story">
            <span className="admin-login-eyebrow">THE ADMIN WORKSPACE</span>
            <h2>Great journeys.<br /><span>Connected by you.</span></h2>
            <p>Bring partners, destinations, and travel experiences together in one place.</p>
          </div>
          <div className="admin-login-destination"><MapPin size={14} aria-hidden="true" /><span>Ella, Sri Lanka</span><span className="admin-login-destination-line" /></div>
        </aside>

        <section className="admin-login-content" aria-labelledby="admin-login-title">
          <div className="admin-login-form-wrap">
            <span className="admin-login-access"><ShieldCheck size={15} aria-hidden="true" /> ADMIN PORTAL</span>
            <h1 id="admin-login-title">Welcome back</h1>
            <p className="admin-login-description">Sign in to your SkyConnect admin account.</p>

            {!firebaseConfigured ? (
              <div className="admin-login-message" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>Configure the Firebase environment variables first.</span></div>
            ) : !ready ? (
              <div className="admin-login-loading" role="status"><LoaderCircle className="admin-login-spinner" size={20} aria-hidden="true" /> Checking access...</div>
            ) : (
              <form className="admin-login-form" onSubmit={submit} aria-busy={busy}>
                <div className="admin-login-field">
                  <label htmlFor="admin-email">Email address</label>
                  <div className="admin-login-input">
                    <Mail size={18} aria-hidden="true" />
                    <input id="admin-email" name="email" type="email" autoComplete="username" placeholder="you@company.com" required value={email} disabled={busy} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="admin-login-field">
                  <label htmlFor="admin-password">Password</label>
                  <div className="admin-login-input">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" required value={password} disabled={busy} onChange={e => setPassword(e.target.value)} />
                    <button className="admin-login-password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                {error && <div className="admin-login-message" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span></div>}
                <button className="admin-login-submit" disabled={busy} type="submit">
                  {busy ? <><LoaderCircle className="admin-login-spinner" size={18} aria-hidden="true" /> Signing in...</> : <>Sign in <ArrowRight size={18} aria-hidden="true" /></>}
                </button>
                {auth.currentUser && <button className="admin-login-switch" disabled={busy} type="button" onClick={() => signOutWithNotifications().catch(e => setError(e.message))}>Use another account</button>}
              </form>
            )}
            <div className="admin-login-security"><LockKeyhole size={14} aria-hidden="true" /><span>Restricted to authorized administrators.</span></div>
          </div>
          <footer className="admin-login-footer">SkyConnect SL <span aria-hidden="true">&middot;</span> Administration workspace</footer>
        </section>
      </div>
    </main>
  );
}
