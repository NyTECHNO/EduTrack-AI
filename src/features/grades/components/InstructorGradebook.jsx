import { profileName } from '../../../lib/profile.js';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import AssessmentForm from './AssessmentForm.jsx';
import BreakdownTable from './BreakdownTable.jsx';
import {
  createAssessment, deleteAssessment, fetchGradebookData, saveGradebook, updateAssessment,
} from '../services/gradesService.js';
import { computeGrade, formatGrade, isPassing, resolveFinal } from '../../../lib/gradeCalculator.js';
import { downloadCsv } from '../../../lib/csv.js';
import { formatDays, formatTimeRange } from '../../../lib/dateTime.js';

const toNum = (s) => (s === '' || s == null ? null : Number(s));

export default function InstructorGradebook({ schedules, settings }) {
  const { user, profile } = useAuth();
  const [scheduleId, setScheduleId] = useState(schedules[0]?.id || '');
  const [periodId, setPeriodId] = useState(settings.periods[0]?.id || '');
  const schedule = schedules.find((s) => s.id === scheduleId);
  const period = settings.periods.find((p) => p.id === periodId);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [method, setMethod] = useState('computed');
  const [weights, setWeights] = useState({});     // categoryId -> text
  const [assessments, setAssessments] = useState([]);
  const [scores, setScores] = useState({});       // uid -> { assessmentId: text }
  const [manual, setManual] = useState({});       // uid -> text
  const [remarks, setRemarks] = useState({});     // uid -> text
  const [roster, setRoster] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [assessForm, setAssessForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [detail, setDetail] = useState(null);

  const defaultWeights = () => Object.fromEntries(settings.categories.map((c) => [c.id, String(c.weight)]));

  useEffect(() => {
    if (!schedule || !period) return undefined;
    let alive = true;
    setLoading(true); setLoadError(''); setNotice(null); setDirty(false);
    fetchGradebookData(schedule.id, period.id, user.uid).then(({ gradebook, assessments: list, grades }) => {
      if (!alive) return;
      const people = new Map((schedule.enrolled || []).map((e) => [e.uid, e]));
      grades.forEach((g) => { if (!people.has(g.studentId)) people.set(g.studentId, { uid: g.studentId, name: g.studentName, idNumber: g.idNumber }); });
      setRoster([...people.values()].sort((a, b) => a.name.localeCompare(b.name)));
      setAssessments(list);
      setMethod(gradebook?.method || 'computed');
      setWeights(gradebook ? Object.fromEntries(settings.categories.map((c) => [c.id, String(gradebook.weights?.[c.id] ?? 0)])) : defaultWeights());
      setScores(Object.fromEntries(grades.map((g) => [g.studentId, Object.fromEntries(Object.entries(g.scores || {}).map(([k, v]) => [k, String(v)]))])));
      setManual(Object.fromEntries(grades.filter((g) => g.manualFinal).map((g) => [g.studentId, String(g.manualFinal.value)])));
      setRemarks(Object.fromEntries(grades.map((g) => [g.studentId, g.remarks || ''])));
    }).catch(() => alive && setLoadError('Could not load the gradebook. Check your connection and that the latest Firestore rules are deployed.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [schedule, period]); // eslint-disable-line react-hooks/exhaustive-deps

  const numWeights = useMemo(() => Object.fromEntries(settings.categories.map((c) => [c.id, Number(weights[c.id]) || 0])), [weights, settings]);
  const weightTotal = settings.categories.reduce((n, c) => n + numWeights[c.id], 0);
  const weightsOk = Math.abs(weightTotal - 100) < 0.001;

  const numScores = useMemo(() => Object.fromEntries(roster.map((p) => [p.uid, Object.fromEntries(
    Object.entries(scores[p.uid] || {}).map(([k, v]) => [k, toNum(v)]).filter(([, v]) => v != null && Number.isFinite(v))
  )])), [roster, scores]);

  const computedBy = useMemo(() => Object.fromEntries(roster.map((p) => [p.uid,
    assessments.length ? computeGrade({ assessments, scores: numScores[p.uid], weights: numWeights, settings }) : null])), [roster, assessments, numScores, numWeights, settings]);

  const finalOf = (uid) => {
    const mv = toNum(manual[uid]);
    return resolveFinal({ method, computed: computedBy[uid], manualFinal: mv != null && Number.isFinite(mv) ? { value: mv } : null, settings });
  };

  const scoreProblem = (uid, a) => {
    const raw = scores[uid]?.[a.id];
    if (raw === '' || raw == null) return false;
    const n = Number(raw);
    return !Number.isFinite(n) || n < 0 || n > a.maxScore;
  };
  const manualProblem = (uid) => {
    const raw = manual[uid];
    if (raw === '' || raw == null) return false;
    const n = Number(raw);
    return !Number.isFinite(n) || n < settings.scale.min || n > settings.scale.max;
  };

  function validate(list) {
    if (method === 'computed' && !weightsOk) return `Category weights add up to ${weightTotal}%. They must total 100%.`;
    if (roster.some((p) => list.some((a) => scoreProblem(p.uid, a)))) return 'Some scores are invalid. A score must be a number from 0 up to the assessment’s highest score.';
    if (roster.some((p) => manualProblem(p.uid))) return `Manual grades must be numbers from ${settings.scale.min} to ${settings.scale.max}.`;
    return '';
  }

  // Saves everything currently on screen. Used by Save and after assessments change (so results stay consistent).
  async function persist(next = {}) {
    const list = next.assessments ?? assessments;
    const sc = next.scores ?? scores;
    const problem = validate(list);
    if (problem) { setNotice({ type: 'error', text: problem }); return false; }
    setSaving(true); setNotice(null);
    try {
      const numeric = Object.fromEntries(roster.map((p) => [p.uid, Object.fromEntries(
        Object.entries(sc[p.uid] || {}).map(([k, v]) => [k, toNum(v)]).filter(([, v]) => v != null && Number.isFinite(v)))]));
      await saveGradebook({
        schedule, period, instructor: { uid: user.uid, name: profileName(profile) }, method, weights: numWeights, roster,
        assessments: list, scores: numeric,
        manual: Object.fromEntries(roster.map((p) => [p.uid, toNum(manual[p.uid])]).filter(([, v]) => v != null && Number.isFinite(v))),
        remarks, settings,
      });
      setDirty(false);
      setNotice({ type: 'ok', text: 'Gradebook saved.' });
      return true;
    } catch {
      setNotice({ type: 'error', text: 'Could not save. Nothing is lost: press Save again to retry.' });
      return false;
    } finally { setSaving(false); }
  }

  async function handleAssessmentSave(values) {
    if (assessForm.assessment) {
      await updateAssessment(assessForm.assessment.id, values);
      const list = assessments.map((a) => (a.id === assessForm.assessment.id ? { ...a, ...values } : a));
      setAssessments(list); setAssessForm(null); await persist({ assessments: list });
    } else {
      const ref = await createAssessment({ ...values, scheduleId: schedule.id, periodId: period.id, instructorId: user.uid });
      const list = [...assessments, { id: ref.id, ...values, scheduleId: schedule.id, periodId: period.id }];
      setAssessments(list); setAssessForm(null); await persist({ assessments: list });
    }
  }

  async function confirmDelete() {
    const target = deleting;
    try {
      await deleteAssessment(target.id);
      const list = assessments.filter((a) => a.id !== target.id);
      const sc = Object.fromEntries(Object.entries(scores).map(([uid, m]) => { const { [target.id]: _drop, ...rest } = m; return [uid, rest]; })); // eslint-disable-line no-unused-vars
      setAssessments(list); setScores(sc); setDeleting(null); await persist({ assessments: list, scores: sc });
    } catch { setNotice({ type: 'error', text: 'Could not delete the assessment.' }); setDeleting(null); }
  }

  const setScore = (uid, aid, value) => { setScores((s) => ({ ...s, [uid]: { ...s[uid], [aid]: value } })); setDirty(true); };
  const setManualVal = (uid, value) => { setManual((m) => ({ ...m, [uid]: value })); setDirty(true); };
  const setRemark = (uid, value) => { setRemarks((r) => ({ ...r, [uid]: value })); setDirty(true); };

  const exportCsv = () => downloadCsv(`${schedule.subjectCode}-${period.name}-grades.csv`.replace(/\s+/g, '_'), [
    { label: 'Student', value: (p) => p.name }, { label: 'ID number', value: (p) => p.idNumber },
    { label: 'Method', value: () => (method === 'manual' ? 'Manual' : 'Computed') },
    { label: 'Computed percentage', value: (p) => computedBy[p.uid]?.percentage ?? '' },
    { label: 'Computed grade', value: (p) => (computedBy[p.uid]?.grade != null ? formatGrade(computedBy[p.uid].grade, settings) : '') },
    { label: 'Manual grade', value: (p) => manual[p.uid] ?? '' },
    { label: 'Final grade', value: (p) => { const f = finalOf(p.uid); return f ? formatGrade(f.value, settings) : ''; } },
    { label: 'Status', value: (p) => finalOf(p.uid)?.status || '' },
    { label: 'Remarks', value: (p) => remarks[p.uid] || '' },
  ], roster);

  return (
    <div className="stack">
      <div className="toolbar toolbar--2">
        <label className="field"><span>Class</span>
          <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            {schedules.map((s) => <option key={s.id} value={s.id}>{s.subjectCode} {s.section && `(${s.section}) `}· {formatDays(s.days)} {formatTimeRange(s.startTime, s.endTime)}</option>)}
          </select></label>
        <label className="field"><span>Grading period</span>
          <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>{settings.periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      </div>

      {notice && <p className={`alert alert--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      {loading ? <p className="muted" role="status">Loading gradebook…</p>
        : loadError ? <p className="alert alert--error" role="alert">{loadError}</p>
        : roster.length === 0 ? <div className="card empty"><p><strong>No students enrolled in this class.</strong></p></div>
        : (
          <>
            <div className="card stack">
              <fieldset className="fieldset">
                <legend className="section-title">Grading method for {period.name}</legend>
                <div className="seg">
                  {[['computed', 'Compute from scores'], ['manual', 'Enter final grades manually']].map(([key, label]) => (
                    <label key={key} className="seg__opt seg__opt--excused">
                      <input type="radio" name="method" checked={method === key} onChange={() => { setMethod(key); setDirty(true); }} /><span>{label}</span>
                    </label>
                  ))}
                </div>
                <p className="muted small">The other method's values are kept for reference but are not the official grade.</p>
              </fieldset>

              {method === 'computed' && (
                <div className="stack">
                  <h3 className="section-title">Category weights</h3>
                  <div className="weights">
                    {settings.categories.map((c) => (
                      <label className="field field--inline" key={c.id}><span>{c.name} %</span>
                        <input inputMode="decimal" value={weights[c.id] ?? ''} onChange={(e) => { setWeights((w) => ({ ...w, [c.id]: e.target.value })); setDirty(true); }} /></label>
                    ))}
                  </div>
                  <p className={weightsOk ? 'muted small' : 'field__error'}>Total {weightTotal}% (must be 100%).{' '}
                    <button type="button" className="linkbtn" onClick={() => { setWeights(defaultWeights()); setDirty(true); }}>Use school defaults</button></p>
                </div>
              )}
            </div>

            {method === 'computed' && (
              <div className="stack">
                <div className="page__head">
                  <h2 className="section-title">Assessments and scores</h2>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => setAssessForm({})}>Add assessment</button>
                </div>
                {assessments.length === 0 ? <div className="card empty"><p><strong>No assessments yet.</strong></p><p className="muted">Add a quiz, activity, assignment or exam, then enter scores.</p></div> : (
                  <div className="card table-card scroll-x">
                    <table className="table table--grid">
                      <thead><tr><th className="sticky">Student</th>
                        {assessments.map((a) => (
                          <th key={a.id}>{a.title}<br /><small className="muted">{settings.categories.find((c) => c.id === a.category)?.name} · /{a.maxScore}</small><br />
                            <button type="button" className="linkbtn" onClick={() => setAssessForm({ assessment: a })}>Edit</button>{' · '}
                            <button type="button" className="linkbtn linkbtn--danger" onClick={() => setDeleting(a)}>Delete</button></th>
                        ))}<th>Computed</th></tr></thead>
                      <tbody>
                        {roster.map((p) => {
                          const c = computedBy[p.uid];
                          return (
                            <tr key={p.uid}>
                              <td className="sticky"><strong>{p.name}</strong>{p.idNumber && <><br /><span className="muted">{p.idNumber}</span></>}</td>
                              {assessments.map((a) => (
                                <td key={a.id}><input className={`scorebox${scoreProblem(p.uid, a) ? ' is-invalid' : ''}`} inputMode="decimal" value={scores[p.uid]?.[a.id] ?? ''}
                                  onChange={(e) => setScore(p.uid, a.id, e.target.value)} aria-label={`${p.name}, ${a.title} score out of ${a.maxScore}`} /></td>
                              ))}
                              <td>{c?.percentage != null ? <><strong>{c.grade != null ? formatGrade(c.grade, settings) : `${c.percentage}%`}</strong><br /><small className="muted">{c.percentage}%</small></> : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <h2 className="section-title">Final grades</h2>
            <div className="card table-card">
              <table className="table">
                <thead><tr><th>Student</th><th>Computed</th>{method === 'manual' && <th>Final grade (manual)</th>}<th>Official</th><th>Status</th><th>Remarks</th>{method === 'computed' && <th>Details</th>}</tr></thead>
                <tbody>
                  {roster.map((p) => {
                    const c = computedBy[p.uid]; const f = finalOf(p.uid);
                    return (
                      <tr key={p.uid}>
                        <td data-label="Student"><strong>{p.name}</strong></td>
                        <td data-label="Computed">{c?.grade != null ? formatGrade(c.grade, settings) : '—'}</td>
                        {method === 'manual' && <td data-label="Final (manual)"><input className={`scorebox${manualProblem(p.uid) ? ' is-invalid' : ''}`} inputMode="decimal" value={manual[p.uid] ?? ''}
                          onChange={(e) => setManualVal(p.uid, e.target.value)} aria-label={`Manual final grade for ${p.name}`} /></td>}
                        <td data-label="Official"><strong>{f ? formatGrade(f.value, settings) : '—'}</strong></td>
                        <td data-label="Status">{f ? <span className={`badge badge--${f.status === 'passed' ? 'present' : 'absent'}`}>{isPassing(f.value, settings.scale) ? 'Passed' : 'Failed'}</span> : <span className="badge badge--off">Not graded</span>}</td>
                        <td data-label="Remarks"><input className="roster__remarks" maxLength={200} value={remarks[p.uid] || ''} onChange={(e) => setRemark(p.uid, e.target.value)} aria-label={`Remarks for ${p.name}`} placeholder="Optional" /></td>
                        {method === 'computed' && <td data-label="Details"><button type="button" className="btn btn--ghost btn--small" onClick={() => setDetail(p)}>Breakdown</button></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="savebar">
              <span className="muted">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
              <button type="button" className="btn btn--ghost" onClick={exportCsv}>Export (CSV)</button>
              <button type="button" className="btn btn--primary" onClick={() => persist()} disabled={saving}>{saving ? 'Saving…' : 'Save gradebook'}</button>
            </div>
          </>
        )}

      {assessForm && <AssessmentForm assessment={assessForm.assessment} categories={settings.categories} onSubmit={handleAssessmentSave} onClose={() => setAssessForm(null)} />}
      {detail && <Modal title={`${detail.name}: breakdown`} onClose={() => setDetail(null)}><BreakdownTable computed={computedBy[detail.uid]} settings={settings} /></Modal>}
      {deleting && (
        <Modal title="Delete assessment?" onClose={() => setDeleting(null)}
          footer={<><button type="button" className="btn btn--ghost" onClick={() => setDeleting(null)}>Cancel</button>
            <button type="button" className="btn btn--danger" onClick={confirmDelete}>Delete</button></>}>
          <p>Delete “{deleting.title}”? Its scores are removed and every student’s computed grade is recalculated and saved.</p>
        </Modal>
      )}
    </div>
  );
}
