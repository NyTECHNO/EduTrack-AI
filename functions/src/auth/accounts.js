const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const ROLES = ['student', 'instructor']; // Admins are only created by scripts/seed-admin.mjs
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireAdmin(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  if (request.auth.token.role !== 'admin') throw new HttpsError('permission-denied', 'Administrators only.');
}

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Admin-only. Creates the Auth user, sets the role claim, and writes users/{uid}.
 * Runs on the server with the Admin SDK, so the admin's own session is untouched.
 * The password is never written to Firestore.
 */
exports.createAccount = onCall(async (request) => {
  requireAdmin(request);
  const email = clean(request.data?.email).toLowerCase();
  const displayName = clean(request.data?.displayName);
  const role = clean(request.data?.role);
  const password = request.data?.password;
  const extra = request.data?.details || {};

  if (!EMAIL_RE.test(email)) throw new HttpsError('invalid-argument', 'Enter a valid email address.');
  if (displayName.length < 2 || displayName.length > 100) throw new HttpsError('invalid-argument', 'Enter the full name.');
  if (!ROLES.includes(role)) throw new HttpsError('invalid-argument', 'Role must be student or instructor.');
  if (typeof password !== 'string' || password.length < 8) throw new HttpsError('invalid-argument', 'Temporary password must be at least 8 characters.');

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({ email, password, displayName });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'An account with this email already exists.');
    throw new HttpsError('internal', 'Could not create the account.');
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, { role });
  await admin.firestore().doc(`users/${userRecord.uid}`).set({
    uid: userRecord.uid,
    email,
    displayName,
    role,
    status: 'active',
    idNumber: clean(extra.idNumber),
    phone: clean(extra.phone),
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    preferences: {},
  });
  return { uid: userRecord.uid };
});

/** Admin-only. Deactivating disables sign-in and revokes existing sessions. */
exports.setAccountStatus = onCall(async (request) => {
  requireAdmin(request);
  const uid = clean(request.data?.uid);
  const status = clean(request.data?.status);
  if (!uid || !['active', 'inactive'].includes(status)) throw new HttpsError('invalid-argument', 'Invalid request.');
  if (uid === request.auth.uid) throw new HttpsError('failed-precondition', 'You cannot deactivate your own account.');

  await admin.auth().updateUser(uid, { disabled: status === 'inactive' });
  if (status === 'inactive') await admin.auth().revokeRefreshTokens(uid);
  await admin.firestore().doc(`users/${uid}`).update({ status });
  return { ok: true };
});

/**
 * Admin-only. Edits name, phone, ID number and role of a Student/Instructor.
 * Role changes update the custom claim and revoke sessions so the new role applies at next sign-in.
 */
exports.updateAccount = onCall(async (request) => {
  requireAdmin(request);
  const uid = clean(request.data?.uid);
  if (!uid) throw new HttpsError('invalid-argument', 'Missing account.');

  const ref = admin.firestore().doc(`users/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Account not found.');
  if (snap.data().role === 'admin') throw new HttpsError('failed-precondition', 'Administrator accounts cannot be edited here.');

  const updates = {};
  const d = request.data;
  if (d.displayName !== undefined) {
    const name = clean(d.displayName);
    if (name.length < 2 || name.length > 100) throw new HttpsError('invalid-argument', 'Enter the full name.');
    updates.displayName = name;
  }
  if (d.phone !== undefined) updates.phone = clean(d.phone).slice(0, 30);
  if (d.idNumber !== undefined) updates.idNumber = clean(d.idNumber).slice(0, 40);
  if (d.role !== undefined) {
    const role = clean(d.role);
    if (!ROLES.includes(role)) throw new HttpsError('invalid-argument', 'Role must be student or instructor.');
    updates.role = role;
  }

  if (updates.displayName) await admin.auth().updateUser(uid, { displayName: updates.displayName });
  if (updates.role && updates.role !== snap.data().role) {
    await admin.auth().setCustomUserClaims(uid, { role: updates.role });
    await admin.auth().revokeRefreshTokens(uid);
  }
  if (Object.keys(updates).length) await ref.update(updates);
  return { ok: true };
});
