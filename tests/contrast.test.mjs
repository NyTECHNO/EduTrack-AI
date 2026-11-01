import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const hexVars = (text) => Object.fromEntries([...text.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const light = hexVars(css.match(/:root \{([\s\S]*?)\n\}/)[1]);
const dark = { ...light, ...hexVars(css.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/)[1]) };

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t));
const lum = (c) => c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }).reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

for (const [name, t] of [['light', light], ['dark', dark]]) {
  const c = (k) => rgb(t[k]);
  test(`${name}: text, headings, links and placeholders are readable (4.5:1 or better)`, () => {
    for (const fg of ['--text', '--heading', '--muted', '--faint', '--accent', '--link']) {
      for (const bg of ['--card', '--bg']) assert.ok(ratio(c(fg), c(bg)) >= 4.5, `${fg} on ${bg}: ${ratio(c(fg), c(bg)).toFixed(2)}`);
    }
    assert.ok(ratio(c('--faint'), c('--input-bg')) >= 4.5, 'placeholder on input');
    assert.ok(ratio(c('--text'), c('--input-bg')) >= 4.5, 'text on input');
  });
  test(`${name}: status colours are readable on their own backgrounds`, () => {
    for (const [fg, bg] of [['--ok-text', '--ok-bg'], ['--danger', '--danger-bg'], ['--warn', '--warn-bg'], ['--accent', '--brand-soft'], ['--muted', '--off-bg']]) {
      assert.ok(ratio(c(fg), c(bg)) >= 4.5, `${fg} on ${bg}: ${ratio(c(fg), c(bg)).toFixed(2)}`);
    }
  });
  test(`${name}: dimmed spotlight cards (opacity .75 over the page) keep 4.5:1 text contrast`, () => {
    const card = mix(c('--card'), c('--bg'), 0.75);
    for (const fg of ['--text', '--heading', '--link']) {
      const text = mix(c(fg), c('--bg'), 0.75);
      assert.ok(ratio(text, card) >= 4.5, `${fg} dimmed: ${ratio(text, card).toFixed(2)}`);
    }
  });
}
