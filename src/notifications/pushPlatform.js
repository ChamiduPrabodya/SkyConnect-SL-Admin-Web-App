import { getApp, SDK_VERSION } from 'firebase/app';
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from 'firebase/messaging';
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
async function messaging() {
  if (typeof window==='undefined'||!window.isSecureContext||!await isSupported()) throw new Error('Push notifications require a supported browser on HTTPS or localhost.');
  return getMessaging(getApp());
}
export async function obtainToken(prompt) {
  if (!vapidKey) { if(!prompt)return null; throw new Error('Browser push is waiting for Firebase Web Push certificate setup.'); }
  if(typeof window==='undefined'||!window.isSecureContext||typeof Notification==='undefined'||!navigator.serviceWorker)throw new Error('Push notifications require a supported browser on HTTPS or localhost.');
  let permission=Notification.permission;
  if(prompt&&permission==='default')permission=await Notification.requestPermission();
  if(permission!=='granted'){if(prompt)throw new Error('Notifications are blocked. Allow them in browser settings.');return null;}
  const m=await messaging();
  const config=getApp().options;
  const params=new URLSearchParams({...config,sdk:SDK_VERSION});
  const registration=await navigator.serviceWorker.register('/firebase-messaging-sw.js?'+params,{scope:'/'});
  if (!registration.active) await navigator.serviceWorker.ready;
  const token=await getToken(m,{vapidKey,serviceWorkerRegistration:registration});
  if(!token)throw new Error('The browser did not return a push token.');
  return {token,platform:'web'};
}
export async function clearToken(){if(typeof window!=='undefined'&&await isSupported())await deleteToken(getMessaging(getApp()));}
export function listen(message,opened) {
  let stop=()=>{},active=true;
  isSupported().then(ok=>{if(ok&&active)stop=onMessage(getMessaging(getApp()),message);}).catch(()=>{});
  const click=e=>{if(e.data?.type==='SKYCONNECT_NOTIFICATION_OPEN')opened({data:e.data.data});};
  navigator.serviceWorker?.addEventListener('message',click);
  const url=new URL(window.location.href);
  const initial=url.searchParams.get('skyconnectNotification');
  if(initial){try{const data=JSON.parse(initial);queueMicrotask(()=>{if(active)opened({data});});}catch{}url.searchParams.delete('skyconnectNotification');window.history.replaceState({},'',url);}
  return()=>{active=false;stop();navigator.serviceWorker?.removeEventListener('message',click);};
}
export function onFocus(callback){window.addEventListener('focus',callback);return()=>window.removeEventListener('focus',callback);}
