export default function Switch({ id, label, hint, checked, onChange, disabled }) {
  return (
    <div className="switchrow">
      <label className="switchrow__text" htmlFor={id}><strong>{label}</strong>{hint && <small>{hint}</small>}</label>
      <span className="switch"><input id={id} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /><span aria-hidden="true" /></span>
    </div>
  );
}
