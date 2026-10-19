import { useEffect, useRef, useState } from 'react';
import { auth } from '../firebase';
import { beginNotificationSession, subscribeNotifications, subscribePushPreference, enablePush, disablePush, persistToken, markNotificationRead, markNotificationsRead, notificationPlatform, notificationApp } from './notificationService';
export function useNotifications(uid, notice) {
  const [notifications,setNotifications] = useState([]), [preference,setPreference] = useState(false), [pushEnabled,setPushEnabled] = useState(false), [notificationError,setError] = useState(''), [pushBusy,setBusy] = useState(false), [notificationOpen,setOpen] = useState(0);
  const noticeRef=useRef(notice); noticeRef.current=notice;
  const activeRef=useRef(uid); activeRef.current=uid;
  const preferenceRef=useRef(preference); preferenceRef.current=preference;
  const error=e=>setError(e.message || 'Notification setup failed.');
  useEffect(()=>{
    setNotifications([]);setPreference(false);setPushEnabled(false);setError('');setOpen(0);
    if(!uid) return;
    if(auth.currentUser?.uid !== uid) return;
    beginNotificationSession(uid);
    let active=true;
    const fail=e=>{if(active&&auth.currentUser?.uid===uid)error(e);};
    const stop=subscribeNotifications(uid, rows=>{if(active)setNotifications(rows);},fail);
    const settings=subscribePushPreference(uid,value=>{if(active)setPreference(value);},fail);
    const message=payload=>{if(active&&auth.currentUser?.uid===uid&&payload.data?.recipientUid===uid&&payload.data?.app===notificationApp)noticeRef.current?.(payload.notification?.title || 'New notification');};
    const opened=payload=>{if(!active||auth.currentUser?.uid!==uid||payload.data?.recipientUid!==uid||payload.data?.app!==notificationApp)return;setOpen(n=>n+1);if(payload.data.notificationId)markNotificationRead(uid,payload.data.notificationId).catch(fail);};
    const handlers=notificationPlatform.listen(message,opened,info=>{if(active&&preferenceRef.current&&auth.currentUser?.uid===uid)persistToken(uid,info).catch(fail);});
    return()=>{active=false;stop();settings();handlers();};
  },[uid]);
  useEffect(()=>{
    let active=true;
    if(!uid||!preference){setPushEnabled(false);return;}
    const resume=()=>enablePush(uid,false).then(ok=>{if(active&&activeRef.current===uid)setPushEnabled(ok);}).catch(e=>{if(active)error(e);});
    resume();
    const unwatch=notificationPlatform.onFocus(resume);
    return()=>{active=false;unwatch();};
  },[uid,preference]);
  const enableNotifications=async()=>{setBusy(true);setError('');try{setPushEnabled(await enablePush(uid,true));}catch(e){error(e);}finally{setBusy(false);}};
  const disableNotifications=async()=>{setBusy(true);setError('');try{await disablePush(uid);setPushEnabled(false);}catch(e){error(e);}finally{setBusy(false);}};
  const markAllNotificationsRead=()=>markNotificationsRead(uid,notifications).catch(error);
  const markOneNotificationRead=id=>markNotificationRead(uid,id).catch(error);
  return {notifications,pushEnabled,pushBusy,notificationError,enableNotifications,disableNotifications,markAllNotificationsRead,markOneNotificationRead,notificationOpen};
}
