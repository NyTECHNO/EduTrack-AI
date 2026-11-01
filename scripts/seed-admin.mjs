// One-time bootstrap of the first Administrator (there is no public sign-up).
// Usage:
//   export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json   (never commit this file)
//   npm run seed:admin -- 00-0-0001 "Full Name" "a-strong-password"      (signs in with the ID number)
//   npm run seed:admin -- admin@school.edu "Full Name" "a-strong-password" (older style, signs in with the email)
import admin from 'firebase-admin';
import { idToEmail, isValidId } from '../src/lib/studentId.js';

const [who, displayName, password] = process.argv.slice(2);
const isId = isValidId(who);
const email = isId ? idToEmail(who) : who;
if (!who || !displayName || !password || password.length < 8) {
  console.error('Usage: npm run seed:admin -- <ID number like 00-0-0001 or email> "<full name>" "<password, 8+ chars>"');
  process.exit(1);
}

admin.initializeApp();
const user = await admin.auth().createUser({ email, password, displayName });
await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
await admin.firestore().doc(`users/${user.uid}`).set({
  uid: user.uid, email, displayName, role: 'admin', status: 'active', idNumber: isId ? who : '',
  createdAt: admin.firestore.FieldValue.serverTimestamp(), preferences: {},
});
console.log(`Admin created: ${isId ? `ID ${who}` : email} (uid ${user.uid})`);
