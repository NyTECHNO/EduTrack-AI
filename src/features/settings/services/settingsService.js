import { doc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth, db } from '../../../firebase/firebase.js';

export const savePreferences = (uid, preferences) => updateDoc(doc(db, 'users', uid), { preferences });

// Firebase requires a recent sign-in, so the current password is checked first.
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
  await updatePassword(user, newPassword);
}

export function describePasswordError(err) {
  switch (err?.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Your current password is incorrect.';
    case 'auth/weak-password': return 'The new password is too weak. Use at least 8 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed': return 'No internet connection. Try again.';
    case 'auth/requires-recent-login': return 'For security, please log out, log in again, and then change your password.';
    default: return 'Could not change the password. Try again.';
  }
}
