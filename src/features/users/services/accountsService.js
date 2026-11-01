import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import { auth, db, firebaseConfig } from '../../../firebase/firebase.js';
import { getAllDocs } from '../../../firebase/queries.js';
import { logActivity } from '../../activity/services/activityService.js';
import { hasScheduleLinks, syncPersonName } from '../../schedules/services/schedulesService.js';

// No Cloud Functions needed (works on the free Spark plan).
// Firestore rules are the enforcement: only Admins can create users documents or change role/status.
// Every page is read (500 at a time); the screen shows 50 rows at a time.
export const fetchAccounts = () => getAllDocs((...c) => query(collection(db, 'users'), orderBy('displayName'), ...c));

// A second, separate Firebase app instance creates the new login so the Admin's own session is untouched.
function provisioningAuth() {
  const name = 'account-provisioner';
  const app = getApps().some((a) => a.name === name) ? getApp(name) : initializeApp(firebaseConfig, name);
  return getAuth(app);
}

export async function createAccount({ email, displayName, role, password, details = {} }) {
  const cleanEmail = email.trim().toLowerCase();
  const secondary = provisioningAuth();
  const credential = await createUserWithEmailAndPassword(secondary, cleanEmail, password);
  try {
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: cleanEmail,
      displayName: displayName.trim(),
      role,
      status: 'active',
      idNumber: (details.idNumber || '').trim(),
      phone: (details.phone || '').trim(),
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
      preferences: {},
    });
  } catch (err) {
    // Don't leave a login with no profile behind.
    await credential.user.delete().catch(() => {});
    throw err;
  } finally {
    await signOut(secondary).catch(() => {});
  }
  logActivity({ action: 'account.created', summary: `Created a ${role} account for ${displayName.trim()} (${details.idNumber || cleanEmail})`, targetType: 'user', targetId: credential.user.uid });
  return { uid: credential.user.uid };
}

export async function updateAccount({ uid, previous, displayName, role, idNumber, phone }) {
  // Changing role while the person still teaches or attends classes would leave broken schedules.
  if (previous && previous.role !== role && await hasScheduleLinks(uid)) {
    throw new Error('This person is still in one or more schedules. Remove them from the schedules before changing their role.');
  }
  const name = displayName.trim();
  await updateDoc(doc(db, 'users', uid), { displayName: name, role, idNumber: (idNumber || '').trim(), phone: (phone || '').trim() });
  // Schedules keep a copy of the name, so keep it in step.
  if (previous && previous.displayName !== name) await syncPersonName(uid, name);
  logActivity({ action: 'account.updated', summary: `Updated the account of ${name}${previous && previous.role !== role ? ` (role ${previous.role} to ${role})` : ''}`, targetType: 'user', targetId: uid });
}

// Inactive accounts are signed out by the app and denied by the rules.
export async function setAccountStatus({ uid, status, name = '' }) {
  await updateDoc(doc(db, 'users', uid), { status });
  const off = status === 'inactive';
  logActivity({ action: off ? 'account.deactivated' : 'account.reactivated', summary: `${off ? 'Deactivated' : 'Reactivated'} the account of ${name || uid}`, targetType: 'user', targetId: uid });
}

// Firebase emails the user a secure reset link; the Admin never sees or sets the new password.
export async function sendResetEmail(email) {
  await sendPasswordResetEmail(auth, email);
  logActivity({ action: 'account.reset', summary: `Sent a password reset email to ${email}`, targetType: 'user' });
}

export function describeServiceError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use': return 'An account with this ID number already exists.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/weak-password': return 'Password is too weak. Use at least 8 characters.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Not allowed. Only active administrators can do this. If you are one, deploy the latest Firestore rules.';
    case 'auth/network-request-failed': return 'No internet connection. Try again.';
    default: return err?.message || 'Something went wrong. Try again.';
  }
}
