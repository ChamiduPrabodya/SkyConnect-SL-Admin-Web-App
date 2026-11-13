import { EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { doc, collection, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { detachPushDevice } from '../notifications/notificationService';
import storage from '../notifications/notificationStorage';
export const PRIVACY_VERSION = '1.0';
export const PRIVACY_SCOPES = ['travel_preferences', 'location_matching'];
export const PRIVACY_NOTICE = 'I explicitly agree to SkyConnect storing and using my travel preferences and selected locations to match travel recommendations. This consent is recorded under Privacy Notice version 1.0. I can request account and data deletion in Privacy & account settings.';
export const PRIVACY_POLICY = 'SkyConnect Privacy Notice - version 1.0. SkyConnect stores account and contact details, preferences, saved trips, likes, bookings, consent records and device registrations in Firebase. Firebase may process data outside Sri Lanka. The purposes described in the consent checkbox are travel or partner-listing matching. Booking requests share the information needed by the selected provider. Device location permission and push notification permission are requested separately; agreeing here does not grant either permission. Do not submit payment-card details. Your consent choice, its server timestamp, version and scopes are recorded. Account deletion is available in Profile or Settings under Privacy & account and on the SkyConnect account-deletion website when published. Deletion removes associated SkyConnect records and account-owned uploaded files across the apps. A minimal private security receipt is eligible for cleanup after 24 hours to prevent old sign-in tokens recreating data; cleanup requires a running backend. Copies independently retained by a provider or downloaded to another device require separate handling.';
export const DELETION_NOTICE = 'Deleting your SkyConnect account removes it across traveler, partner and admin apps. Your profile, preferences, likes, saved plans, notification history, device registrations, bookings, owned listings and uploaded account files will be removed. This cannot be undone. A minimal private security receipt remains until cleanup after 24 hours to block old sign-in tokens. Processing requires the SkyConnect backend to be running.';
export async function getPrivacyRecord() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  const first = await getDoc(doc(db, 'users', user.uid));
  if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Sign in again.');
  const applies = value => value?.agreed === true && value.version === PRIVACY_VERSION && PRIVACY_SCOPES.every(scope => value.scopes?.includes(scope));
  if (first.exists() && applies(first.data().pdpaConsent)) return first.data().pdpaConsent;
  const other = await getDoc(doc(db, 'partners', user.uid));
  if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Sign in again.');
  return applies(other.data()?.pdpaConsent) ? other.data().pdpaConsent : null;
}
export async function recordPrivacyConsent() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in first.');
  const uid = user.uid, ref = doc(db, 'users', uid);
  const receipt = doc(collection(db, 'users', uid, 'consents'));
  const pdpaConsent = { agreed: true, timestamp: serverTimestamp(), version: PRIVACY_VERSION, scopes: PRIVACY_SCOPES };
  await runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    if (auth.currentUser?.uid !== uid) throw new Error('Account changed. Sign in again.');
    if (current.exists()) transaction.update(ref, { pdpaConsent, pdpaConsentRecordId: receipt.id });
    else if ('users' === 'users') transaction.set(ref, { id: uid, uid, email: user.email || '', name: user.displayName || '', role: 'traveler', createdAt: new Date().toISOString(), pdpaConsent, pdpaConsentRecordId: receipt.id });
    else throw new Error('Partner profile is missing.');
    transaction.set(receipt, pdpaConsent);
  });
  return true;
}
export async function requestAccountDeletion(password, confirmation) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Sign in with your registered email and password first.');
  if (confirmation !== 'DELETE') throw new Error('Type DELETE to confirm permanent account deletion.');
  if (!password) throw new Error('Enter your current password.');
  const uid = user.uid;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  const token = await user.getIdTokenResult(true);
  if (auth.currentUser?.uid !== uid) throw new Error('Account changed. Sign in again.');
  await detachPushDevice();
  const ref = doc(db, 'accountDeletionRequests', uid);
  await runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    if (auth.currentUser?.uid !== uid) throw new Error('Account changed. Sign in again.');
    if (!current.exists()) transaction.set(ref, { uid, status: 'pending', requestedAt: serverTimestamp(), authTime: token.claims.auth_time });
  });
  // Acceptance is durable before local cleanup/sign-out. Cleanup failure must
  // not imply that the already-accepted server request was rolled back.
  let signedOut = false;
  if (auth.currentUser?.uid !== uid) return { accepted: true, signedOut: false };
  try {
    const keys = storage.getAllKeys ? await storage.getAllKeys() : typeof window !== 'undefined' ? Object.keys(window.localStorage) : [];
    for (const key of keys.filter(key => key.startsWith('@skyconnect/') || key.startsWith('skyconnect-') || key.startsWith('@zuno-airline/'))) await storage.removeItem(key);
  } catch {}
  try { if (auth.currentUser?.uid === uid) { await signOut(auth); signedOut = true; } } catch {}
  return { accepted: true, signedOut };
}
