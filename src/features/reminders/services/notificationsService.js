import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';

// notifications/{uid_date_scheduleId_time}: one per person per class occurrence. The id is the duplicate guard:
// a second create of the same id is refused by the rules, so only one device/tab announces it.
export function subscribeToNotifications(uid, onData, onError) {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))), onError);
}

export const createNotification = (uid, n, browserState) => setDoc(doc(db, 'notifications', n.id), {
  userId: uid, type: n.type, title: n.title, body: n.body, scheduleId: n.scheduleId, classDate: n.classDate,
  read: false, delivery: { inApp: true, browser: browserState }, createdAt: serverTimestamp(),
});

export const markRead = (id) => updateDoc(doc(db, 'notifications', id), { read: true });
