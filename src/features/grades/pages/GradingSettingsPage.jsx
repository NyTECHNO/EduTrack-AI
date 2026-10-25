import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import useGradingSettings from '../hooks/useGradingSettings.js';
import { saveSettings } from '../services/gradesService.js';
import { DEFAULT_GRADING, validateGradingSettings } from '../../../lib/gradingDefaults.js';

const newId = () => `x${Math.random().toString(36).slice(2, 8)}`;
const str = (n) => String(n);

const toDraft = (s) => ({
  periods: s.periods.map((p) => ({ ...p })),
  min: str(s.scale.min), max: str(s.scale.max), passingMark: str(s.scale.passingMark), higherIsBetter: s.scale.higherIsBetter,
  decimals: str(s.rounding.decimals), mode: s.rounding.mode, missingScores: s.missingScores,
  categories: s.categories.map((c) => ({ ...c, weight: str(c.weight) })),
  conversion: s.conversion.map((r) => ({ minPercent: str(r.minPercent), grade: str(r.grade) })),
});
const num = (v) => (String(v).trim() === '' ? NaN : Number(v));
const fromDraft = (d) => ({
  periods: d.periods.map((p) => ({ id: p.id, name: p.name.trim() })),
  scale: { min: num(d.min), max: num(d.max), passingMark: num(d.passingMark), higherIsBetter: d.higherIsBetter },
  rounding: { decimals: num(d.decimals), mode: d.mode },
  missingScores: d.missingScores,
  categories: d.categories.map((c) => ({ id: c.id, name: c.name.trim(), weight: num(c.weight) })),
  conversion: d.conversion.map((r) => ({ minPercent: num(r.minPercent), grade: num(r.grade) })),
});

export default function GradingSettingsPage() {
  const { user } = useAuth();
  const { loading, settings, error, reload } = useGradingSettings();
  const [draft, setDraft] = useState(null);
  const [problems, setProblems] = useState({ errors: [], warnings: [] });
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !error) setDraft(toDraft(settings || DEFAULT_GRADING)); }, [loading, error, settings]);

  if (loading || (!draft && !error)) return <section className="page__section"><p className="muted" role="status">Loading grading settings…</p></section>;
  if (error) return <section className="page__section"><p className="alert alert--error" role="alert">{error}</p><button type="button" className="btn btn--ghost" onClick={reload}>Try again</button></section>;

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const edit = (list, i, patch) => setDraft((d) => ({ ...d, [list]: d[list].map((row, j) => (j === i ? { ...row, ...patch } : row)) }));
  const remove = (list, i) => setDraft((d) => ({ ...d, [list]: d[list].filter((_, j) => j !== i) }));
  const weightTotal = draft.categories.reduce((n, c) => n + (Number(c.weight) || 0), 0);

  async function handleSave(e) {
    e.preventDefault();
    const next = fromDraft(draft);
    const result = validateGradingSettings(next);
    setProblems(result); setNotice(null);
    if (result.errors.length) return;
    setSaving(true);
    try { await saveSettings(next, user.uid); setNotice({ type: 'ok', text: 'Grading settings saved. Instructors can now use the gradebook.' }); reload(); }
    catch { setNotice({ type: 'error', text: 'Could not save. Check your connection and that the latest Firestore rules are deployed.' }); }
    finally { setSaving(false); }
  }

  return (
    <section className="page__section">
      <h1 className="page__title">Grading settings</h1>
      {!settings && <p className="alert alert--warn">Grading is not set up yet. The values below are <strong>placeholders</strong>. Change them to match the school's policy, then save. Instructors cannot use the gradebook until you do.</p>}
      {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      {problems.errors.length > 0 && <div className="alert alert--error" role="alert"><strong>Fix these first</strong><ul className="conflicts">{problems.errors.map((m) => <li key={m}>{m}</li>)}</ul></div>}
      {problems.warnings.length > 0 && <div className="alert alert--warn"><ul className="conflicts">{problems.warnings.map((m) => <li key={m}>{m}</li>)}</ul></div>}

      <form className="stack" onSubmit={handleSave} noValidate>
        <div className="card stack">
          <h2 className="section-title">Grading periods</h2>
          {draft.periods.map((p, i) => (
            <div className="inline" key={p.id}>
              <input value={p.name} onChange={(e) => edit('periods', i, { name: e.target.value })} aria-label={`Period ${i + 1} name`} maxLength={40} />
              <button type="button" className="btn btn--danger btn--small" onClick={() => remove('periods', i)}>Remove</button>
            </div>
          ))}
          <div><button type="button" className="btn btn--ghost btn--small" onClick={() => setDraft((d) => ({ ...d, periods: [...d.periods, { id: newId(), name: '' }] }))}>Add period</button></div>
        </div>

        <div className="card stack">
          <h2 className="section-title">Scale and passing mark</h2>
          <div className="form-grid">
            <label className="field"><span>Lowest grade</span><input inputMode="decimal" value={draft.min} onChange={set('min')} /></label>
            <label className="field"><span>Highest grade</span><input inputMode="decimal" value={draft.max} onChange={set('max')} /></label>
            <label className="field"><span>Passing mark</span><input inputMode="decimal" value={draft.passingMark} onChange={set('passingMark')} /></label>
            <label className="field"><span>Which direction is better?</span>
              <select value={String(draft.higherIsBetter)} onChange={(e) => setDraft((d) => ({ ...d, higherIsBetter: e.target.value === 'true' }))}>
                <option value="true">Higher is better (for example 0 to 100)</option>
                <option value="false">Lower is better (for example 1.0 best to 5.0)</option>
              </select></label>
          </div>
        </div>

        <div className="card stack">
          <h2 className="section-title">Rounding and missing scores</h2>
          <div className="form-grid">
            <label className="field"><span>Decimal places</span><input inputMode="numeric" value={draft.decimals} onChange={set('decimals')} /></label>
            <label className="field"><span>Rounding</span>
              <select value={draft.mode} onChange={set('mode')}><option value="nearest">Round to nearest</option><option value="down">Always round down</option><option value="up">Always round up</option></select></label>
            <label className="field span-2"><span>Missing scores</span>
              <select value={draft.missingScores} onChange={set('missingScores')}>
                <option value="zero">Count a missing score as zero</option>
                <option value="exclude">Leave missing scores out of the average</option>
              </select></label>
          </div>
        </div>

        <div className="card stack">
          <h2 className="section-title">Assessment categories and default weights</h2>
          {draft.categories.map((c, i) => (
            <div className="inline" key={c.id}>
              <input value={c.name} onChange={(e) => edit('categories', i, { name: e.target.value })} aria-label={`Category ${i + 1} name`} maxLength={40} />
              <input className="narrow" inputMode="decimal" value={c.weight} onChange={(e) => edit('categories', i, { weight: e.target.value })} aria-label={`${c.name || 'Category'} weight percent`} />
              <span aria-hidden="true">%</span>
              <button type="button" className="btn btn--danger btn--small" onClick={() => remove('categories', i)}>Remove</button>
            </div>
          ))}
          <p className={Math.abs(weightTotal - 100) < 0.001 ? 'muted' : 'field__error'}>Total: {weightTotal}% (must be 100%). Instructors can adjust weights per class.</p>
          <div><button type="button" className="btn btn--ghost btn--small" onClick={() => setDraft((d) => ({ ...d, categories: [...d.categories, { id: newId(), name: '', weight: '0' }] }))}>Add category</button></div>
        </div>

        <div className="card stack">
          <h2 className="section-title">Conversion table (optional)</h2>
          <p className="muted">Only needed if grades are reported on a scale other than a percentage, for example 1.0 to 5.0. Each row says: from this percentage and above, the grade is this. Include a row starting at 0.</p>
          {draft.conversion.map((r, i) => (
            <div className="inline" key={i}>
              <label className="inline__label">From % <input className="narrow" inputMode="decimal" value={r.minPercent} onChange={(e) => edit('conversion', i, { minPercent: e.target.value })} /></label>
              <label className="inline__label">Grade <input className="narrow" inputMode="decimal" value={r.grade} onChange={(e) => edit('conversion', i, { grade: e.target.value })} /></label>
              <button type="button" className="btn btn--danger btn--small" onClick={() => remove('conversion', i)}>Remove</button>
            </div>
          ))}
          <div><button type="button" className="btn btn--ghost btn--small" onClick={() => setDraft((d) => ({ ...d, conversion: [...d.conversion, { minPercent: '', grade: '' }] }))}>Add row</button></div>
        </div>

        <div><button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Save grading settings'}</button></div>
      </form>
    </section>
  );
}
