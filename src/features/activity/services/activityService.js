import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, startAfter } from 'firebase/firestore';
import { db } from '../../../firebase/firebase.js';

// activityLog/{id}: who did what, and when. Anyone signed in can add entries about their OWN actions; only Admins can read them;
// nobody can edit or delete them (see firestore.rules), so the trail can be trusted.
let actor = null; // { uid, name, role }, set by AuthContext after sign-in
export const setActivityActor = (value) => { actor = value; };

// Best effort: recording an action must never block or break the action itself.
export async function logActivity({ action, summary, targetType = '', targetId = '' }) {
  if (!actor) return;
  try {
    await addDoc(collection(db, 'activityLog'), {
      actorId: actor.uid, actorName: actor.name, actorRole: actor.role,
      action, summary: String(summary).slice(0, 300), targetType, targetId, createdAt: serverTimestamp(),
    });
  } catch { /* ignore */ }
}

export async function fetchActivityPage({ after = null, size = 50 } = {}) {
  const base = collection(db, 'activityLog');
  const q = after ? query(base, orderBy('createdAt', 'desc'), startAfter(after), limit(size)) : query(base, orderBy('createdAt', 'desc'), limit(size));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) })),
    last: snap.docs[snap.docs.length - 1] || null,
    done: snap.docs.length < size,
  };
}
