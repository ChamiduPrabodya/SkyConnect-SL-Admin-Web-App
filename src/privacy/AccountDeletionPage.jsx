import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, firebaseConfigured } from '../firebase';
import { DELETION_NOTICE, requestAccountDeletion } from './privacyService';
import { signOutWithNotifications } from '../notifications/notificationService';

export default function AccountDeletionPage() {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false);
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [accepted, setAccepted] = useState(false);
  useEffect(() => { if (!auth) return; return onAuthStateChanged(auth, current => { setUser(current); setReady(true); }); }, []);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      if (!user) { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }
      else { await requestAccountDeletion(password, confirmation); setPassword(''); setConfirmation(''); setAccepted(true); }
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  return <main style={{maxWidth:620,margin:'7vh auto',padding:28,lineHeight:1.7}}>
    <h1>SkyConnect account and data deletion</h1>
    <p>This page is for SkyConnect traveler, airline and tourism partner accounts. You can request deletion here without installing the mobile app. Administrator access is not required.</p>
    <p>{DELETION_NOTICE}</p>
    {accepted ? <p role="status"><strong>Your request was accepted.</strong> Data removal is pending backend processing. This message is not a completion confirmation.</p>
      : !firebaseConfigured ? <p role="alert">Firebase configuration is missing.</p> : !ready ? <p>Checking sign-in...</p> : <form onSubmit={submit}>
        {user ? <><p>Signed in as <strong>{user.email}</strong>.</p><p>Enter your current password again to confirm your identity.</p></> : <label>Registered email<input type="email" autoComplete="username" required value={email} onChange={event=>setEmail(event.target.value)}/></label>}
        <label>Current password<input type="password" autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)}/></label>
        {user && <label>Type DELETE to confirm permanent deletion<input value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="off" required pattern="DELETE"/></label>}
        <button type="submit" disabled={busy || (Boolean(user) && confirmation!=='DELETE')}>{busy?'Working...':user?'Request permanent deletion':'Sign in to request deletion'}</button>
        {user && <button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await signOutWithNotifications();setPassword('');setConfirmation('');}catch(error){setMessage(error.message);}finally{setBusy(false);}}}>Use another account</button>}
        {!user && <button type="button" disabled={busy || !email.trim()} onClick={async()=>{setBusy(true);try{await sendPasswordResetEmail(auth,email.trim());setMessage('If this email has an eligible account, password reset instructions have been requested.');}catch(error){setMessage(error.message);}finally{setBusy(false);}}}>Reset password</button>}
      </form>}
    <p role="status">{message}</p>
    <p>Deletion removes records held by SkyConnect. Copies independently retained by a provider or downloaded to another device require separate handling. SkyConnect does not collect payments in this implementation.</p>
  </main>;
}
