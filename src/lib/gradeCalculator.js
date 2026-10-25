// The ONE place grades are computed. Every screen and export uses these functions.
// Rules (all driven by the settings the Admin saved):
//  1. For each category: percent = sum(scores) / sum(max scores) x 100.
//     Missing scores follow settings.missingScores: "zero" counts them as 0, "exclude" leaves them out.
//  2. Categories with nothing to grade yet are left out and the remaining weights are rescaled to 100%.
//  3. The percentage is rounded once, using settings.rounding, then converted by settings.conversion if one exists.
//  4. Pass/fail uses settings.scale.passingMark (and its direction).

function shiftDecimals(value, places) {
  const [mantissa, exponent = '0'] = String(value).split('e');
  return Number(`${mantissa}e${Number(exponent) + places}`);
}

export function roundTo(value, { decimals, mode }) {
  const fn = mode === 'down' ? Math.floor : mode === 'up' ? Math.ceil : Math.round;
  return shiftDecimals(fn(shiftDecimals(value, decimals)), -decimals);
}

export function isPassing(value, scale) {
  return scale.higherIsBetter ? value >= scale.passingMark : value <= scale.passingMark;
}

export function formatGrade(value, settings) {
  if (value == null) return '—';
  return Number(value).toFixed(settings?.rounding?.decimals ?? 2);
}

function convertPercent(percent, settings) {
  const table = [...(settings.conversion || [])].sort((a, b) => b.minPercent - a.minPercent);
  if (table.length) return (table.find((row) => percent >= row.minPercent) || null)?.grade ?? null;
  const { min, max } = settings.scale;
  return min === 0 && max === 100 ? Math.min(max, Math.max(min, percent)) : null;
}

/**
 * assessments: [{ id, title, category, maxScore }]
 * scores:      { [assessmentId]: number }   (absent or non-number = missing)
 * weights:     { [categoryId]: number }     (percent)
 */
export function computeGrade({ assessments, scores, weights, settings }) {
  const breakdown = settings.categories.map((cat) => {
    const items = assessments.filter((a) => a.category === cat.id).map((a) => {
      const raw = scores[a.id];
      return { id: a.id, title: a.title, max: a.maxScore, score: typeof raw === 'number' && Number.isFinite(raw) ? raw : null };
    });
    let earned = 0;
    let possible = 0;
    items.forEach((i) => {
      if (i.score != null) { earned += i.score; possible += i.max; } else if (settings.missingScores === 'zero') possible += i.max;
    });
    const weight = Number(weights[cat.id] ?? 0);
    const percent = possible > 0 ? (earned / possible) * 100 : null;
    return { categoryId: cat.id, name: cat.name, weight, items, earned, possible, percent, included: percent !== null && weight > 0 };
  });

  const used = breakdown.filter((b) => b.included);
  const weightUsed = used.reduce((n, b) => n + b.weight, 0);
  if (!used.length) return { percentage: null, grade: null, breakdown, weightUsed: 0, reason: 'no-scores' };

  const raw = used.reduce((n, b) => n + b.weight * b.percent, 0) / weightUsed;
  const percentage = roundTo(raw, { decimals: settings.rounding.decimals, mode: settings.rounding.mode });
  const grade = convertPercent(percentage, settings);
  return { percentage, grade, breakdown, weightUsed, reason: grade == null ? 'no-conversion' : null };
}

// The official grade is whichever method the instructor chose; the other value is kept for reference only.
export function resolveFinal({ method, computed, manualFinal, settings }) {
  const value = method === 'manual' ? manualFinal?.value ?? null : computed?.grade ?? null;
  if (value == null) return null;
  return { value, status: isPassing(value, settings.scale) ? 'passed' : 'failed', method };
}
