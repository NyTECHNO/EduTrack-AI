import { idToEmail, isValidId } from '../../src/lib/studentId.js';

// Turns what a person types (an ID number like 12-3-4567, or an email) into the address the account was created with.
export function resolveEmail(who) {
  const value = String(who ?? '').trim();
  if (isValidId(value)) return idToEmail(value);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value.toLowerCase();
  return null;
}

export const passwordProblem = (password) =>
  (typeof password === 'string' && password.length >= 8 ? '' : 'The new password must be at least 8 characters.');

/**
 * Sets a new password for one account and signs it out everywhere.
 * `auth` and `db` are firebase-admin's auth() and firestore() (or test doubles).
 */
export async function resetPassword({ auth, db }, who, newPassword) {
  const email = resolveEmail(who);
  if (!email) throw new Error('Give an ID number like 12-3-4567, or the email address of an older account.');
  const problem = passwordProblem(newPassword);
  if (problem) throw new Error(problem);

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (err) {
    if (err?.code === 'auth/user-not-found') throw new Error(`No account was found for "${who}". Run this command with --list to see every account.`);
    throw err;
  }
  await auth.updateUser(user.uid, { password: newPassword });
  await auth.revokeRefreshTokens(user.uid); // old sessions end; the new password is required at the next sign-in

  const snap = await db.doc(`users/${user.uid}`).get();
  const profile = snap.exists ? snap.data() : null;
  const warnings = [];
  if (!profile) warnings.push('This sign-in has no profile in the app, so it cannot sign in until a profile exists.');
  else if (profile.status !== 'active') warnings.push('This account is deactivated. An Admin must reactivate it before it can sign in.');
  if (user.disabled) warnings.push('This sign-in is disabled in Firebase Authentication.');
  return { uid: user.uid, email, profile, warnings };
}

// Every sign-in with its profile, so the right account can be picked out.
export async function listAccounts({ auth, db }) {
  const users = [];
  let pageToken;
  do {
    // eslint-disable-next-line no-await-in-loop
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  const profiles = new Map();
  for (let i = 0; i < users.length; i += 300) {
    const refs = users.slice(i, i + 300).map((u) => db.doc(`users/${u.uid}`));
    // eslint-disable-next-line no-await-in-loop
    (await db.getAll(...refs)).forEach((snap, k) => profiles.set(users[i + k].uid, snap.exists ? snap.data() : null));
  }
  return users.map((u) => {
    const p = profiles.get(u.uid);
    return {
      signIn: p?.idNumber && String(u.email).endsWith('@id.edutrack.local') ? `ID ${p.idNumber}` : u.email,
      name: p?.displayName || u.displayName || '(no name)',
      role: p?.role || '(no profile)',
      status: p ? p.status : '-',
      uid: u.uid,
    };
  }).sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name));
}
