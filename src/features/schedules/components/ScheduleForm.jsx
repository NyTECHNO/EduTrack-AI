import { useState } from 'react';
import Modal from '../../../components/ui/Modal.jsx';
import { DAYS } from '../../../lib/dateTime.js';
import { findConflicts, validateSchedule } from '../../../lib/scheduleUtils.js';

export default function ScheduleForm({ schedule, subjects, instructors, allSchedules, onSubmit, onClose }) {
  const isEdit = Boolean(schedule);
  const [v, setV] = useState({
    subjectId: schedule?.subjectId || '', instructorId: schedule?.instructorId || '',
    section: schedule?.section || '', days: schedule?.days || [], startTime: schedule?.startTime || '',
    endTime: schedule?.endTime || '', room: schedule?.room || '', termStart: schedule?.termStart || '', termEnd: schedule?.termEnd || '',
  });
  const [errors, setErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const toggleDay = (key) => setV((s) => ({ ...s, days: s.days.includes(key) ? s.days.filter((d) => d !== key) : [...s.days, key] }));

  // Archived subjects stay selectable only on schedules that already use them.
  const subjectOptions = subjects.filter((s) => s.status === 'active' || s.id === schedule?.subjectId);

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateSchedule(v);
    setErrors(found); setConflicts([]); setFormError('');
    if (Object.keys(found).length) return;

    const subject = subjects.find((s) => s.id === v.subjectId);
    const instructor = instructors.find((i) => i.id === v.instructorId)
      || (schedule?.instructorId === v.instructorId ? { id: schedule.instructorId, displayName: schedule.instructorName } : null);
    const data = {
      subjectId: subject.id, subjectCode: subject.code, subjectName: subject.name,
      instructorId: instructor.id, instructorName: instructor.displayName,
      section: v.section.trim(), days: v.days, startTime: v.startTime, endTime: v.endTime,
      room: v.room.trim(), termStart: v.termStart, termEnd: v.termEnd,
    };
    const clashes = findConflicts({ ...data, status: schedule?.status || 'active' }, allSchedules, schedule?.id);
    if (clashes.length) { setConflicts(clashes); return; }

    setBusy(true);
    try { await onSubmit(data); } catch (err) { setFormError(err.message || 'Could not save the schedule.'); setBusy(false); }
  }

  const err = (k) => errors[k] && <span className="field__error">{errors[k]}</span>;

  return (
    <Modal title={isEdit ? 'Edit schedule' : 'New schedule'} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" form="schedule-form" className="btn btn--primary" disabled={busy}>{busy ? 'Saving…' : 'Save schedule'}</button>
      </>}>
      <form id="schedule-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError && <p className="alert alert--error span-2" role="alert">{formError}</p>}
        {conflicts.length > 0 && (
          <div className="alert alert--error span-2" role="alert">
            <strong>Schedule conflict</strong>
            <ul className="conflicts">{conflicts.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}

        <label className="field span-2"><span>Subject</span>
          <select value={v.subjectId} onChange={set('subjectId')}>
            <option value="">Choose a subject…</option>
            {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>{err('subjectId')}
        </label>

        <label className="field span-2"><span>Instructor</span>
          <select value={v.instructorId} onChange={set('instructorId')}>
            <option value="">Choose an instructor…</option>
            {schedule && !instructors.some((i) => i.id === schedule.instructorId) && (
              <option value={schedule.instructorId}>{schedule.instructorName} (inactive)</option>)}
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.displayName}</option>)}
          </select>{err('instructorId')}
        </label>

        <label className="field"><span>Section / class (optional)</span>
          <input value={v.section} onChange={set('section')} maxLength={40} autoComplete="off" /></label>
        <label className="field"><span>Room</span>
          <input value={v.room} onChange={set('room')} maxLength={40} autoComplete="off" />{err('room')}</label>

        <fieldset className="field span-2 fieldset">
          <legend>Days</legend>
          <div className="chips">
            {DAYS.map((d) => (
              <label key={d.key} className="chip">
                <input type="checkbox" checked={v.days.includes(d.key)} onChange={() => toggleDay(d.key)} />
                <span title={d.label}>{d.key}</span>
              </label>
            ))}
          </div>{err('days')}
        </fieldset>

        <label className="field"><span>Start time</span><input type="time" value={v.startTime} onChange={set('startTime')} />{err('startTime')}</label>
        <label className="field"><span>End time</span><input type="time" value={v.endTime} onChange={set('endTime')} />{err('endTime')}</label>
        <label className="field"><span>Term starts (optional)</span><input type="date" value={v.termStart} onChange={set('termStart')} /></label>
        <label className="field"><span>Term ends (optional)</span><input type="date" value={v.termEnd} onChange={set('termEnd')} />{err('termEnd')}</label>
      </form>
    </Modal>
  );
}
