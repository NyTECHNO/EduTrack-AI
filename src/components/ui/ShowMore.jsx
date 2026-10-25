export default function ShowMore({ total, shown, step = 50, onMore }) {
  if (total <= shown) return null;
  return (
    <div className="showmore">
      <button type="button" className="btn btn--ghost btn--small" onClick={onMore}>Show {Math.min(step, total - shown)} more ({total - shown} left)</button>
    </div>
  );
}
