import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const sources = walk('src').filter((f) => /\.(js|jsx)$/.test(f));

test('every relative import points at a file that exists (catches truncated or moved files)', () => {
  const broken = [];
  for (const file of sources) {
    for (const m of readFileSync(file, 'utf8').matchAll(/(?:from|import)\s+'(\.[^']+)'/g)) {
      if (!existsSync(normalize(join(dirname(file), m[1])))) broken.push(`${file} -> ${m[1]}`);
    }
  }
  assert.deepEqual(broken, []);
});
test('every React component file has a default export and is not empty', () => {
  for (const file of sources.filter((f) => f.endsWith('.jsx') && !f.endsWith('main.jsx'))) {
    const text = readFileSync(file, 'utf8');
    assert.ok(text.length > 80, `${file} looks truncated`);
    assert.match(text, /export default|export function|export const/, `${file} has no export`);
  }
});

test('helper functions that a file calls are imported (or defined) in that file', () => {
  const helpers = ['profileName', 'profileInitial', 'accountLabel', 'idToEmail', 'isIdEmail', 'isValidId', 'formatIdInput', 'logActivity', 'formatGrade', 'useAuth', 'useNotifications'];
  const missing = [];
  for (const file of sources) {
    const text = readFileSync(file, 'utf8');
    for (const name of helpers) {
      const used = new RegExp(`(?<![\\w.])${name}\\(`).test(text);
      const known = new RegExp(`import[^;]*\\b${name}\\b[^;]*from|(?:function|const)\\s+${name}\\b|export (?:async )?function ${name}\\b|export const ${name}\\b`).test(text);
      if (used && !known) missing.push(`${file} uses ${name}() without importing it`);
    }
  }
  assert.deepEqual(missing, []);
});
test('the account menu has Profile, Settings and Log out, and the sidebar no longer has a footer', () => {
  const menu = readFileSync('src/components/layout/UserMenu.jsx', 'utf8');
  assert.match(menu, /role="menu"/); assert.match(menu, /Log out/); assert.match(menu, /aria-haspopup="menu"/); assert.match(menu, /Escape/);
  const nav = readFileSync('src/components/layout/navConfig.js', 'utf8');
  assert.match(nav, /label: 'Profile'/); assert.match(nav, /label: 'Settings'/);
  assert.doesNotMatch(readFileSync('src/components/layout/Sidebar.jsx', 'utf8'), /sidebar__foot|Log out/);
});
