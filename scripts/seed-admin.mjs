// One-time bootstrap of the first Administrator (there is no public sign-up).
// Usage:
//   export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json   (never commit this file)
//   npm run seed:admin -- admin@school.edu "Full Name" "a-strong-password"
import admin from 'firebase-admin';

const [email, displayName, password] = process.argv.slice(2);
if (!email || !displayName || !password || password.length < 8) {
  console.error('Usage: npm run seed:admin -- <email> "<full name>" "<password, 8+ chars>"');
  process.exit(1);
}

admin.initializeApp();
const user = await admin.auth().createUser({ email, password, displayName });
await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
await admin.firestore().doc(`users/${user.uid}`).set({
  uid: user.uid, email, displayName, role: 'admin', status: 'active',
  createdAt: admin.firestore.FieldValue.serverTimestamp(), preferences: {},
});
console.log(`Admin created: ${email} (uid ${user.uid})`);
