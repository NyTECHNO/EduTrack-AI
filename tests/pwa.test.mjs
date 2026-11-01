import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const html = read('index.html');
const worker = read('public/service-worker.js');

test('manifest meets the install requirements', () => {
  for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'icons', 'theme_color', 'background_color']) assert.ok(manifest[key], key);
  assert.equal(manifest.display, 'standalone');
  const sizes = manifest.icons.map((i) => `${i.sizes}:${i.purpose}`);
  assert.ok(sizes.includes('192x192:any') && sizes.includes('512x512:any'), 'any 192 and 512');
  assert.ok(sizes.includes('512x512:maskable'), 'maskable icon');
  manifest.icons.forEach((i) => assert.ok(existsSync(new URL(`../public${i.src}`, import.meta.url)), i.src));
  (manifest.shortcuts || []).forEach((s) => assert.ok(s.url.startsWith('/')));
});
test('page links the manifest, iOS icon and standalone metadata', () => {
  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.ok(existsSync(new URL('../public/icons/apple-touch-icon.png', import.meta.url)));
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /viewport-fit=cover/);
});
test('service worker handles fetches, falls back offline, and never caches Firebase', () => {
  assert.match(worker, /addEventListener\('fetch'/);
  assert.match(worker, /offline\.html/);
  assert.ok(existsSync(new URL('../public/offline.html', import.meta.url)));
  assert.match(worker, /straight to the network/); // cross-origin requests other than fonts are not intercepted
  assert.doesNotMatch(worker, /firestore\.googleapis|identitytoolkit|firebaseio/);
});
test('light is the default theme; dark is opt-in only', () => {
  assert.doesNotMatch(html, /prefers-color-scheme/);
  assert.match(html, /\?\s*JSON\.parse\(raw\)\s*:\s*'light'/);
  assert.doesNotMatch(read('src/hooks/useTheme.js'), /prefers-color-scheme/);
  assert.match(read('src/hooks/useTheme.js'), /useLocalStorage\(THEME_KEY, 'light'\)/);
});
