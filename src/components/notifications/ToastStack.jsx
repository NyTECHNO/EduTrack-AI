import { useEffect } from 'react';
import Icon from '../ui/Icon.jsx';
import './notifications.css';

function Toast({ toast, onDismiss }) {
  useEffect(() => { const t = setTimeout(() => onDismiss(toast.id), 15000); return () => clearTimeout(t); }, [toast.id, onDismiss]);
  return (
    <div className="toast">
      <Icon name="bell" />
      <div className="toast__text"><strong>{toast.title}</strong><span>{toast.body}</span></div>
      <button type="button" className="icon-btn" onClick={() => onDismiss(toast.id)} aria-label="Dismiss"><Icon name="x" size={18} /></button>
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}
