import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const app = firebaseConfigured
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (app && import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true' && !globalThis.__skyconnectAdminEmulatorsConnected) {
 const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';
 connectAuthEmulator(auth, `http://${host}:9099`, {disableWarnings:true});
 connectFirestoreEmulator(db, host, 8080);
 globalThis.__skyconnectAdminEmulatorsConnected = true;
}
