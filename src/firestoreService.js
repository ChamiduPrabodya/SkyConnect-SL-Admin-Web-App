import { serverTimestamp } from 'firebase/firestore';
import { addDoc, collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
function clean(value) { if (!auth?.currentUser || !db) throw new Error('Sign in first.'); return JSON.parse(JSON.stringify(value)); }
export const createRecord = (name, value) => addDoc(collection(db, name), { ...clean({ ...value, createdAt: new Date().toISOString() }), notificationUpdatedAt: serverTimestamp() });
export const saveRecord = (name, id, value) => setDoc(doc(db, name, id), { ...clean({ ...value, updatedAt: new Date().toISOString() }), notificationUpdatedAt: serverTimestamp() }, { merge: true });
export const removeRecord = (name, id) => deleteDoc(doc(db, name, id));
export const persistStatus = (name, id, status) => updateDoc(doc(db, name, id), { ...clean({ status, updatedAt: new Date().toISOString(), ...(name === 'partners' ? { verified: status === 'Approved' } : {}) }), notificationUpdatedAt: serverTimestamp() });
