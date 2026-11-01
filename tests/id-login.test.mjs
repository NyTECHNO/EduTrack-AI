import test from 'node:test';
import assert from 'node:assert/strict';
import { ID_EMAIL_DOMAIN, accountLabel, formatIdInput, idToEmail, isIdEmail, isValidId } from '../src/lib/studentId.js';

test('ID numbers must look like 12-3-4567', () => {
  for (const ok of ['12-3-4567', '00-0-0001', '99-9-9999']) assert.equal(isValidId(ok), true, ok);
  for (const bad of ['', '1234567', '12-34-567', '1-2-3456', '12-3-456', '12-3-45678', 'ab-c-defg', '12-3-4567 x', '12/3/4567']) assert.equal(isValidId(bad), false, bad);
  assert.equal(isValidId(' 12-3-4567 '), true); // surrounding spaces are ignored
});
test('typing and pasting digits adds the hyphens in the right places', () => {
  const steps = { '1': '1', '12': '12', '123': '12-3', '1234': '12-3-4', '1234567': '12-3-4567', '12-3-4567': '12-3-4567', '12345678999': '12-3-4567', 'a1b2c3': '12-3', '': '' };
  for (const [typed, shown] of Object.entries(steps)) assert.equal(formatIdInput(typed), shown, `typed "${typed}"`);
  assert.equal(formatIdInput('12-'), '12'); // deleting a hyphen never gets stuck
});
test('an ID becomes an internal sign-in address that is never shown', () => {
  assert.equal(idToEmail('12-3-4567'), `12-3-4567@${ID_EMAIL_DOMAIN}`);
  assert.equal(isIdEmail(idToEmail('12-3-4567')), true);
  assert.equal(isIdEmail('admin@jpc.com'), false);
  assert.equal(accountLabel({ email: idToEmail('12-3-4567'), idNumber: '12-3-4567' }), '12-3-4567');
  assert.equal(accountLabel({ email: 'old@jpc.com', idNumber: '' }), 'old@jpc.com');
});
