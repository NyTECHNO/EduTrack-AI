import test from 'node:test';
import assert from 'node:assert/strict';
import { listAccounts, passwordProblem, resetPassword, resolveEmail } from '../scripts/lib/accounts.mjs';

// Test doubles for firebase-admin's auth() and firestore()
function fakeProject(users, profiles) {
  const calls = { updated: [], revoked: [] };
  const auth = {
    getUserByEmail: async (email) => { const u = users.find((x) => x.email === email); if (!u) { const e = new Error('nope'); e.code = 'auth/user-not-found'; throw e; } return u; },
    updateUser: async (uid, data) => calls.updated.push([uid, data]),
    revokeRefreshTokens: async (uid) => calls.revoked.push(uid),
    listUsers: async (max, token) => (token ? { users: users.slice(2), pageToken: undefined } : { users: users.slice(0, 2), pageToken: users.length > 2 ? 'next' : undefined }),
  };
  const snap = (uid) => ({ exists: uid in profiles, data: () => profiles[uid] });
  const db = { doc: (path) => ({ path, get: async () => snap(path.split('/')[1]) }), getAll: async (...refs) => refs.map((r) => snap(r.path.split('/')[1])) };
  return { auth, db, calls };
}
const users = [
  { uid: 'a1', email: '00-0-0001@id.edutrack.local', displayName: 'Admin One' },
  { uid: 'a2', email: 'old@jpc.com', displayName: '' },
  { uid: 's1', email: '12-3-4567@id.edutrack.local', displayName: 'Ana Cruz' },
];
const profiles = {
  a1: { displayName: 'Admin One', role: 'admin', status: 'active', idNumber: '00-0-0001' },
  a2: { displayName: 'Old Admin', role: 'admin', status: 'active', idNumber: '' },
  s1: { displayName: 'Ana Cruz', role: 'student', status: 'inactive', idNumber: '12-3-4567' },
};

test('an ID number or an email resolves to the address the account was created with', () => {
  assert.equal(resolveEmail('00-0-0001'), '00-0-0001@id.edutrack.local');
  assert.equal(resolveEmail(' Old@JPC.com '), 'old@jpc.com');
  assert.equal(resolveEmail('1234567'), null);
  assert.equal(resolveEmail('hello'), null);
  assert.equal(resolveEmail(undefined), null);
});
test('short passwords are refused before anything is touched', async () => {
  assert.notEqual(passwordProblem('short'), ''); assert.equal(passwordProblem('longenough1'), '');
  const { auth, db, calls } = fakeProject(users, profiles);
  await assert.rejects(resetPassword({ auth, db }, '00-0-0001', 'short'), /at least 8/);
  assert.equal(calls.updated.length, 0);
});
test('resetting sets the new password and signs the account out everywhere', async () => {
  const { auth, db, calls } = fakeProject(users, profiles);
  const r = await resetPassword({ auth, db }, '00-0-0001', 'NewPassword9');
  assert.deepEqual(calls.updated, [['a1', { password: 'NewPassword9' }]]);
  assert.deepEqual(calls.revoked, ['a1']);
  assert.equal(r.profile.role, 'admin'); assert.deepEqual(r.warnings, []);
  const legacy = await resetPassword({ auth, db }, 'old@jpc.com', 'AnotherPass1');
  assert.equal(legacy.uid, 'a2');
});
test('unknown accounts are explained, and deactivated or profile-less accounts are flagged', async () => {
  const { auth, db } = fakeProject(users, profiles);
  await assert.rejects(resetPassword({ auth, db }, '99-9-9999', 'NewPassword9'), /--list/);
  const flagged = await resetPassword({ auth, db }, '12-3-4567', 'NewPassword9');
  assert.match(flagged.warnings.join(' '), /deactivated/);
  const noProfile = fakeProject(users, {});
  assert.match((await resetPassword(noProfile, '00-0-0001', 'NewPassword9')).warnings.join(' '), /no profile/);
});
test('--list shows every account across pages, with ID sign-ins labelled and admins first', async () => {
  const { auth, db } = fakeProject(users, profiles);
  const rows = await listAccounts({ auth, db });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((r) => r.role), ['admin', 'admin', 'student']);
  assert.equal(rows.find((r) => r.uid === 'a1').signIn, 'ID 00-0-0001');
  assert.equal(rows.find((r) => r.uid === 'a2').signIn, 'old@jpc.com');
});
