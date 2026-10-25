import { STATUSES } from '../../../lib/attendanceStats.js';

// Four-way radio group (Present / Absent / Late / Excused). Keyboard and screen-reader friendly.
export default function StatusPicker({ name, label, value, onChange }) {
  return (
    <fieldset className="seg fieldset">
      <legend className="sr-only">{label}</legend>
      {STATUSES.map((s) => (
        <label key={s.key} className={`seg__opt seg__opt--${s.key}`}>
          <input type="radio" name={name} value={s.key} checked={value === s.key} onChange={() => onChange(s.key)} />
          <span>{s.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
