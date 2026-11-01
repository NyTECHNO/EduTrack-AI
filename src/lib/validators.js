import { ID_EXAMPLE, isValidId } from './studentId.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns an object of field -> message. Empty object means valid.
export function validateAccountForm(values, { isEdit }) {
  const errors = {};
  const name = values.displayName.trim();
  if (name.length < 2) errors.displayName = 'Enter the full name.';
  if (!isEdit) {
    if (!isValidId(values.idNumber)) errors.idNumber = `Enter the ID number as ${ID_EXAMPLE}.`;
    if (values.password.length < 8) errors.password = 'Use at least 8 characters.';
  }
  if (!['student', 'instructor'].includes(values.role)) errors.role = 'Choose a role.';
  return errors;
}
