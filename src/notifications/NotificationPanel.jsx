import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
export default function NotificationPanel({ state, notify, children }) {
  const { notifications, pushEnabled, pushBusy, notificationError, enableNotifications, disableNotifications, markAllNotificationsRead, markOneNotificationRead } = state;
  const [form,setForm]=useState({uid:'',app:'traveler',title:'',body:''}), [sending,setSending]=useState(false);
  const update=(key,value)=>setForm(p=>({...p,[key]:value}));
  const send=async event=>{
    event.preventDefault();setSending(true);
    try {
      await addDoc(collection(db,'notificationRequests'),{uid:form.uid.trim(),app:form.app,title:form.title.trim(),body:form.body.trim(),createdBy:auth.currentUser.uid,createdAt:serverTimestamp(),state:'pending'});
      notify('Notification queued. The backend worker will process it.');setForm(p=>({...p,title:'',body:''}));
    } catch(error){notify(error.message);}finally{setSending(false);}
  };
  return <div className="notification-pop" style={{maxHeight:'80vh',overflowY:'auto',width:360}}>
    <strong>Notifications</strong>
    <button disabled={pushBusy} onClick={pushEnabled?disableNotifications:enableNotifications}>{pushBusy?'Updating…':pushEnabled?'Disable browser push':'Enable browser push'}</button>
    {notificationError&&<p role="alert">{notificationError}</p>}
    <button onClick={markAllNotificationsRead}>Mark all as read</button>
    {!notifications.length&&<p>No notifications yet.</p>}
    {notifications.map(n=><button key={n.id} onClick={()=>markOneNotificationRead(n.id)} style={{display:'block',textAlign:'left',width:'100%',padding:'10px 0'}}><strong>{n.unread?'• ':''}{n.title}</strong><p>{n.body}</p><small>{n.time}</small></button>)}
    {children}<hr/>
    <details><summary>Send a notification</summary><form onSubmit={send}>
      <label>Recipient Auth UID<input required value={form.uid} maxLength={128} onChange={e=>update('uid',e.target.value)}/></label>
      <label>App<select value={form.app} onChange={e=>update('app',e.target.value)}><option value="traveler">Traveler</option><option value="partner">Partner</option><option value="admin">Admin</option></select></label>
      <label>Title<input required maxLength={100} value={form.title} onChange={e=>update('title',e.target.value)}/></label>
      <label>Message<textarea required maxLength={500} value={form.body} onChange={e=>update('body',e.target.value)}/></label>
      <button type="submit" disabled={sending}>{sending?'Queuing…':'Queue notification'}</button>
    </form></details>
  </div>;
}
