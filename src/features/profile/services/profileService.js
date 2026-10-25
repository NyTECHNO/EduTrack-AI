import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../../firebase/firebase.js';

// People edit their own phone. Names are copied into schedules, attendance and grades, so they change through
// the Admin (Accounts page); an Admin may edit their own name. The Firestore rules enforce the same limits.
export async function saveProfile({ uid, displayName, phone, canEditName }) {
  const data = { phone: phone.trim() };
  if (canEditName) data.displayName = displayName.trim();
  await updateDoc(doc(db, 'users', uid), data);
  if (canEditName && auth.currentUser) await updateProfile(auth.currentUser, { displayName: data.displayName });
  return data;
}

export const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;
