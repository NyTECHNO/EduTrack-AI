import test from 'node:test';
import assert from 'node:assert/strict';
import { computeGrade, resolveFinal, roundTo, isPassing } from '../src/lib/gradeCalculator.js';
import { DEFAULT_GRADING, validateGradingSettings } from '../src/lib/gradingDefaults.js';

const settings = DEFAULT_GRADING;
const assessments = [{ id: 'q1', title: 'Q1', category: 'quiz', maxScore: 20 }, { id: 'e1', title: 'Exam', category: 'exam', maxScore: 100 }];
const weights = { quiz: 20, activity: 20, assignment: 10, exam: 50 };

test('weights only the categories that have scores, rescaled to 100%', () => {
  const r = computeGrade({ assessments, scores: { q1: 18, e1: 80 }, weights, settings });
  assert.equal(r.percentage, 82.86); // (20*90 + 50*80) / 70
  assert.equal(r.weightUsed, 70);
});
test('missing score counts as zero or is excluded, per settings', () => {
  assert.equal(computeGrade({ assessments, scores: { q1: 18 }, weights, settings }).percentage, 25.71);
  assert.equal(computeGrade({ assessments, scores: { q1: 18 }, weights, settings: { ...settings, missingScores: 'exclude' } }).percentage, 90);
});
test('no scores gives no grade', () => assert.equal(computeGrade({ assessments, scores: {}, weights, settings: { ...settings, missingScores: 'exclude' } }).percentage, null));
test('rounding modes and floating point edge cases', () => {
  assert.equal(roundTo(1.005, { decimals: 2, mode: 'nearest' }), 1.01);
  assert.equal(roundTo(82.859, { decimals: 2, mode: 'down' }), 82.85);
  assert.equal(roundTo(82.851, { decimals: 2, mode: 'up' }), 82.86);
  assert.equal(roundTo(74.5, { decimals: 0, mode: 'nearest' }), 75);
});
test('conversion table maps a percentage onto a 1.0 to 5.0 scale (lower is better)', () => {
  const conv = { ...settings, scale: { min: 1, max: 5, passingMark: 3, higherIsBetter: false }, conversion: [{ minPercent: 0, grade: 5 }, { minPercent: 75, grade: 3 }, { minPercent: 90, grade: 1.5 }] };
  const r = computeGrade({ assessments, scores: { q1: 18, e1: 80 }, weights, settings: conv });
  assert.equal(r.grade, 3);
  assert.equal(resolveFinal({ method: 'computed', computed: r, manualFinal: null, settings: conv }).status, 'passed');
  assert.equal(isPassing(3.5, conv.scale), false);
});
test('a non-percentage scale without a conversion table gives no computed grade', () => {
  const r = computeGrade({ assessments, scores: { q1: 18, e1: 80 }, weights, settings: { ...settings, scale: { min: 1, max: 5, passingMark: 3, higherIsBetter: false } } });
  assert.equal(r.grade, null); assert.equal(r.reason, 'no-conversion');
});
test('official grade follows the chosen method; the other is only reference', () => {
  const computed = computeGrade({ assessments, scores: { q1: 18, e1: 80 }, weights, settings });
  assert.equal(resolveFinal({ method: 'manual', computed, manualFinal: { value: 90 }, settings }).value, 90);
  assert.equal(resolveFinal({ method: 'computed', computed, manualFinal: { value: 90 }, settings }).value, 82.86);
  assert.equal(resolveFinal({ method: 'manual', computed, manualFinal: null, settings }), null);
});
test('settings validation catches bad policies', () => {
  assert.deepEqual(validateGradingSettings(settings).errors, []);
  assert.ok(validateGradingSettings({ ...settings, categories: [{ id: 'a', name: 'A', weight: 50 }] }).errors.some((e) => /100%/.test(e)));
  assert.ok(validateGradingSettings({ ...settings, scale: { ...settings.scale, passingMark: 200 } }).errors.length);
  assert.ok(validateGradingSettings({ ...settings, scale: { min: 1, max: 5, passingMark: 3, higherIsBetter: false } }).warnings.length);
});
