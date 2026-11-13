// Public Firebase client configuration is passed in the worker registration URL.
// Register clicks before the Firebase SDK so navigation stays inside this app.
self.addEventListener('notificationclick',event=>{
  event.stopImmediatePropagation();event.notification.close();
  const data=event.notification.data?.FCM_MSG?.data || event.notification.data || {};
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    const client=windows.find(c=>c.url.startsWith(self.registration.scope));
    if(client){await client.focus();client.postMessage({type:'SKYCONNECT_NOTIFICATION_OPEN',data});}
    else {const url=new URL(self.registration.scope);url.searchParams.set('skyconnectNotification',JSON.stringify(data));await clients.openWindow(url.href);}
  })());
});
const params=new URL(self.location.href).searchParams;
const config=Object.fromEntries(['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'].map(key=>[key,params.get(key)]));
const sdk=params.get('sdk');
if(config.apiKey&&config.projectId&&/^\d+\.\d+\.\d+$/.test(sdk||'')){
  importScripts(`https://www.gstatic.com/firebasejs/${sdk}/firebase-app-compat.js`);
  importScripts(`https://www.gstatic.com/firebasejs/${sdk}/firebase-messaging-compat.js`);
  firebase.initializeApp(config);
  // Notification payloads are displayed by FCM. Avoid displaying a duplicate here.
  firebase.messaging().onBackgroundMessage(()=>{});
}
