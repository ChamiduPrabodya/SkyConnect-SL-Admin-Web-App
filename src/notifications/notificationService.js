import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, limit, writeBatch, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import storage from './notificationStorage';
import * as platform from './pushPlatform';
export const notificationApp = 'admin';
const bindingKey = '@skyconnect/push/' + notificationApp + '/binding';
const idKey = '@skyconnect/push/' + notificationApp + '/id';
let suspendedUid = null;
export function beginNotificationSession(uid) { current(uid); suspendedUid = null; }
function canRegister(uid) { current(uid); if(suspendedUid === uid) throw new Error('Notification registration is paused for this session.'); }
function current(uid) { if (!uid || auth?.currentUser?.uid !== uid) throw new Error('Sign in to manage notifications.'); }
export function subscribeNotifications(uid, callback, error) {
  return onSnapshot(query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50)), snap => {
    if (auth.currentUser?.uid !== uid) return;
    callback(snap.docs.map(d => ({ ...d.data(), id:d.id, unread:!d.data().read, time:new Date(d.data().createdAt).toLocaleString(), icon:d.data().category === 'booking' ? 'calendar-outline' : 'notifications-outline', iconColor:'#38BDF8', iconBg:'rgba(56,189,248,0.15)' })).filter(n => n.app === notificationApp));
  }, error);
}
export function subscribePushPreference(uid, callback, error) {
  return onSnapshot(doc(db,'users',uid,'settings','notifications'), snap => callback(snap.data()?.[notificationApp] === true), error);
}
export async function persistToken(uid, tokenInfo, explicit = false) {
  canRegister(uid);
  if(!explicit){const preference=await getDoc(doc(db,'users',uid,'settings','notifications'));canRegister(uid);if(preference.data()?.[notificationApp] !== true)return false;}
  const previous = JSON.parse(await storage.getItem(bindingKey) || 'null');
  if (previous && previous.uid !== uid) { await platform.clearToken(); await storage.removeItem(bindingKey); throw new Error('Device registration reset after account change. Enable notifications again.'); }
  let id = await storage.getItem(idKey);
  if (!id) { id = notificationApp + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); await storage.setItem(idKey,id); }
  canRegister(uid);
  const target = doc(db,'users',uid,'devices',id);
  const existing = await getDoc(target);
  canRegister(uid);
  if (!existing.exists() || existing.data().token !== tokenInfo.token || !existing.data().enabled) {
    await setDoc(target,{ app:notificationApp, provider:'fcm', platform:tokenInfo.platform, token:tokenInfo.token, enabled:true, updatedAt:serverTimestamp() });
  }
  await storage.setItem(bindingKey,JSON.stringify({uid,id}));
  return true;
}
export async function enablePush(uid, prompt = true) {
  current(uid);
  if(!prompt && suspendedUid === uid) return false;
  if(prompt) suspendedUid = null;
  if(!prompt){const preference=await getDoc(doc(db,'users',uid,'settings','notifications'));current(uid);if(preference.data()?.[notificationApp] !== true)return false;}
  const previous = JSON.parse(await storage.getItem(bindingKey) || 'null');
  if (previous && previous.uid !== uid) { await platform.clearToken(); await storage.removeItem(bindingKey); }
  const tokenInfo = await platform.obtainToken(prompt);
  if (!tokenInfo) return false;
  current(uid);
  try { if(!await persistToken(uid,tokenInfo,prompt)){await platform.clearToken();return false;} }
  catch (error) { await platform.clearToken().catch(()=>{}); throw error; }
  if (prompt) await setDoc(doc(db,'users',uid,'settings','notifications'),{[notificationApp]:true},{merge:true});
  return true;
}
export async function detachPushDevice() {
  suspendedUid = auth?.currentUser?.uid || null;
  const binding = JSON.parse(await storage.getItem(bindingKey) || 'null');
  if (!binding) { await platform.clearToken(); return; }
  // Invalidate the OS/browser token first, including after an external account change.
  await platform.clearToken();
  if (auth?.currentUser?.uid === binding.uid) await deleteDoc(doc(db,'users',binding.uid,'devices',binding.id));
  await storage.removeItem(bindingKey);
}
export async function disablePush(uid) {
  current(uid);
  await setDoc(doc(db,'users',uid,'settings','notifications'),{[notificationApp]:false},{merge:true});
  await detachPushDevice();
}
export async function signOutWithNotifications() { await detachPushDevice(); return signOut(auth); }
export function markNotificationRead(uid,id) { current(uid); return updateDoc(doc(db,'users',uid,'notifications',id),{read:true,readAt:new Date().toISOString()}); }
export async function markNotificationsRead(uid,items) {
  current(uid);
  const batch = writeBatch(db);
  for (const n of items.filter(n=>n.unread)) batch.update(doc(db,'users',uid,'notifications',n.id),{read:true,readAt:new Date().toISOString()});
  await batch.commit();
}
export { platform as notificationPlatform };
