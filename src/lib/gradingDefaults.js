// PLACEHOLDER defaults shown on the Admin "Grading settings" page until the school confirms its real policy.
// Nothing here is used for grading until an Admin saves settings (stored in settings/grading).
export const DEFAULT_GRADING = {
  periods: [{ id: 'prelim', name: 'Prelim' }, { id: 'midterm', name: 'Midterm' }, { id: 'finals', name: 'Finals' }],
  scale: { min: 0, max: 100, passingMark: 75, higherIsBetter: true },
  rounding: { decimals: 2, mode: 'nearest' }, // nearest | down | up
  missingScores: 'zero', // zero: a missing score counts as 0 | exclude: it is left out of the average
  categories: [
    { id: 'quiz', name: 'Quizzes', weight: 20 },
    { id: 'activity', name: 'Activities', weight: 20 },
    { id: 'assignment', name: 'Assignments', weight: 10 },
    { id: 'exam', name: 'Examinations', weight: 50 },
  ],
  // Optional. Rows of { minPercent, grade } that turn a computed percentage into the school's scale (e.g. 1.0 to 5.0).
  conversion: [],
};

export function validateGradingSettings(s) {
  const errors = [];
  const warnings = [];
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const dupe = (names) => new Set(names.map((n) => n.trim().toLowerCase())).size !== names.length;

  if (!s.periods.length) errors.push('Add at least one grading period.');
  if (s.periods.some((p) => !p.name.trim())) errors.push('Every grading period needs a name.');
  else if (dupe(s.periods.map((p) => p.name))) errors.push('Grading period names must be different.');

  const { min, max, passingMark } = s.scale;
  if (![min, max, passingMark].every(finite)) errors.push('Scale minimum, maximum and passing mark must be numbers.');
  else {
    if (min >= max) errors.push('The scale maximum must be greater than the minimum.');
    if (passingMark < min || passingMark > max) errors.push('The passing mark must be within the scale.');
  }
  if (!Number.isInteger(s.rounding.decimals) || s.rounding.decimals < 0 || s.rounding.decimals > 4) errors.push('Decimal places must be a whole number from 0 to 4.');

  if (!s.categories.length) errors.push('Add at least one assessment category.');
  if (s.categories.some((c) => !c.name.trim())) errors.push('Every category needs a name.');
  else if (dupe(s.categories.map((c) => c.name))) errors.push('Category names must be different.');
  if (s.categories.some((c) => !finite(c.weight) || c.weight < 0)) errors.push('Category weights must be numbers of 0 or more.');
  else if (Math.abs(s.categories.reduce((n, c) => n + c.weight, 0) - 100) > 0.001) errors.push('Default category weights must add up to exactly 100%.');

  if (s.conversion.length) {
    if (s.conversion.some((r) => !finite(r.minPercent) || r.minPercent < 0 || r.minPercent > 100)) errors.push('Conversion rows need a minimum percent from 0 to 100.');
    else if (new Set(s.conversion.map((r) => r.minPercent)).size !== s.conversion.length) errors.push('Conversion rows must have different minimum percents.');
    else if (!s.conversion.some((r) => r.minPercent === 0)) errors.push('Conversion table needs a row that starts at 0%, so every percentage maps to a grade.');
    if (s.conversion.some((r) => !finite(r.grade) || r.grade < min || r.grade > max)) errors.push('Every converted grade must be a number within the scale.');
  } else if (finite(min) && finite(max) && (min !== 0 || max !== 100)) {
    warnings.push('This scale is not 0 to 100, so computed grades need a conversion table. Without one, only manual final grades work.');
  }
  return { errors, warnings };
}
