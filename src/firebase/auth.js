import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { idToEmail } from '../lib/studentId.js';

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const signInWithId = (id, password) => signIn(idToEmail(id), password);

export const signOutUser = () => signOut(auth);

// Turn Firebase error codes into messages a student or teacher can act on.
export function describeAuthError(error, mode = 'id') {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return mode === 'id' ? 'ID number or password is incorrect.' : 'Email or password is incorrect.';
    case 'auth/user-disabled':
      return 'This account is deactivated. Contact the school administrator.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes, then try again.';
    case 'auth/network-request-failed':
      return 'No internet connection. Check your network and try again.';
    default:
      return error?.message || 'Could not sign in. Try again.';
  }
}
