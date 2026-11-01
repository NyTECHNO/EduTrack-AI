// People sign in with their school ID number, e.g. 12-3-4567 (two digits, one digit, four digits).
// Firebase Authentication needs an email, so the ID is turned into one internally. It is never shown and never receives mail.
export const ID_EXAMPLE = '12-3-4567';
export const ID_PATTERN = /^\d{2}-\d-\d{4}$/;
export const ID_EMAIL_DOMAIN = 'id.edutrack.local';

// Accounts created before ID sign-in were made with a real email. While this is true, the login page offers a small
// "older account" link so nobody is locked out. Set it to false once every account has an ID.
export const ALLOW_EMAIL_LOGIN = true;

// Keeps the hyphens in the right places while typing or pasting: "1234567" becomes "12-3-4567".
export function formatIdInput(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 7);
  if (digits.length <= 2) return digits;
  if (digits.length === 3) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 3)}-${digits.slice(3)}`;
}

export const isValidId = (id) => ID_PATTERN.test(String(id ?? '').trim());
export const idToEmail = (id) => `${String(id).trim()}@${ID_EMAIL_DOMAIN}`;
export const isIdEmail = (email) => typeof email === 'string' && email.endsWith(`@${ID_EMAIL_DOMAIN}`);

// What to show for an account: its ID number, or the real email of an older account.
export const accountLabel = (account) => (isIdEmail(account?.email) ? account.idNumber : account?.email) || '';
