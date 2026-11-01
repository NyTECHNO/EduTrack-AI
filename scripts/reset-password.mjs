// Sets a new password for any account (use it when the Admin, or anyone, has forgotten theirs).
// It uses your project's service-account key, so run it only on your own computer and keep that key private.
//
// 1) Point to the key (from the edutrack-ai folder):
//      PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS=".\service-account.json"
//      Mac/Linux:   export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
// 2) See every account:        npm run reset:password -- --list
// 3) Set a new password:       npm run reset:password -- 00-0-0001 'MyNewPassword123'
//    (an ID number, or the email of an older account; use single quotes in PowerShell)
import { existsSync } from 'node:fs';
import admin from 'firebase-admin';
import { listAccounts, resetPassword } from './lib/accounts.mjs';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyPath) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set.\n  PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS=".\\service-account.json"\n  Mac/Linux:   export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json');
  process.exit(1);
}
if (!existsSync(keyPath)) {
  console.error(`The key file was not found: ${keyPath}\nRun this from the edutrack-ai folder, and check that service-account.json is there.`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args[0] !== '--list' && args.length !== 2) {
  console.error('Usage:\n  npm run reset:password -- --list\n  npm run reset:password -- <ID number or email> \'<new password, 8+ characters>\'');
  process.exit(1);
}

admin.initializeApp();
const ctx = { auth: admin.auth(), db: admin.firestore() };

try {
  if (args[0] === '--list') {
    const rows = await listAccounts(ctx);
    console.table(rows.map(({ signIn, name, role, status }) => ({ 'Sign in with': signIn, Name: name, Role: role, Status: status })));
    console.log(`${rows.length} accounts. To reset one: npm run reset:password -- <ID number or email> '<new password>'`);
  } else {
    const [who, password] = args;
    const result = await resetPassword(ctx, who, password);
    console.log(`\nPassword changed for ${result.profile?.displayName || result.email} (${result.profile?.role || 'no profile'}).`);
    console.log(`Sign in with: ${result.email.endsWith('@id.edutrack.local') ? `ID number ${who}` : `email ${result.email}`} and the new password.`);
    result.warnings.forEach((w) => console.log(`Warning: ${w}`));
  }
  process.exit(0);
} catch (err) {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
}
