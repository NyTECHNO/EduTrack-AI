import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { useNotifications } from '../../features/reminders/NotificationsProvider.jsx';
import { askPermission, permissionState } from '../../lib/browserNotify.js';
import './notifications.css';

function timeAgo(date) {
  if (!date) return '';
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const { items, unread, error, ready, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(permissionState());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="bell" ref={ref}>
      <button type="button" className="icon-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
        <Icon name="bell" />
        {unread > 0 && <span className="bell__badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notifpanel" role="dialog" aria-label="Notifications">
          <header className="notifpanel__head">
            <strong>Notifications</strong>
            <button type="button" className="linkbtn" onClick={markAllRead} disabled={!unread}>Mark all read</button>
          </header>
          <div className="notifpanel__list">
            {error ? <p className="alert alert--error">{error}</p>
              : !ready ? <p className="muted notifpanel__empty">Loading…</p>
              : items.length === 0 ? <p className="muted notifpanel__empty">No notifications yet. Class reminders appear here 30 minutes before each class.</p>
              : items.map((n) => (
                <button type="button" key={n.id} className={`notif${n.read ? '' : ' is-unread'}`} onClick={() => !n.read && markRead(n.id)}>
                  <span className="notif__dot" aria-hidden="true" />
                  <span className="notif__text"><strong>{n.title}</strong><span>{n.body}</span><small>{timeAgo(n.createdAt?.toDate?.())}</small></span>
                </button>
              ))}
          </div>
          <footer className="notifpanel__foot">
            {permission === 'default' && <button type="button" className="btn btn--ghost btn--small" onClick={async () => setPermission(await askPermission())}>Turn on browser notifications</button>}
            {permission === 'granted' && <span className="muted small">Browser notifications are on.</span>}
            {permission === 'denied' && <span className="muted small">Browser notifications are blocked. Allow them in your browser’s site settings.</span>}
            {permission === 'unsupported' && <span className="muted small">This browser does not support notifications.</span>}
            <span className="muted small">Reminders are sent while EduTrack AI is open in a browser tab or as an installed app.</span>
          </footer>
        </div>
      )}
    </div>
  );
}
