import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import ToastStack from '../../components/notifications/ToastStack.jsx';
import { createNotification, markRead as markReadDoc, subscribeToNotifications } from './services/notificationsService.js';
import { planCancellations, planReminders } from './lib/reminderPlanner.js';
import { fetchMySchedules } from '../schedules/services/schedulesService.js';
import { permissionState, showBrowserNotification } from '../../lib/browserNotify.js';
import { getNotificationPrefs } from '../../lib/preferences.js';

const NotificationsContext = createContext(null);
export const useNotifications = () => useContext(NotificationsContext);

const TICK_MS = 30000;          // how often due reminders are checked
const REFRESH_MS = 5 * 60000;   // how often the class list is refreshed (picks up schedule edits and cancellations)
const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

export function NotificationsProvider({ children }) {
  const { user, role, profile } = useAuth();
  const { classReminders: wantReminders, cancellations: wantCancellations, browser: wantBrowser } = getNotificationPrefs(profile);
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [schedules, setSchedules] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Live list of this person's notifications.
  useEffect(() => subscribeToNotifications(user.uid,
    (list) => { setItems(list); setReady(true); setError(''); },
    () => { setReady(true); setError('Notifications could not load. The latest Firestore rules and indexes may not be deployed yet.'); }), [user.uid]);

  // Keep the person's classes fresh. Admins have no classes to be reminded about.
  useEffect(() => {
    if (role === 'admin') return undefined;
    let alive = true;
    const load = () => fetchMySchedules(user.uid, role).then((s) => alive && setSchedules(s)).catch(() => {});
    load();
    const timer = setInterval(load, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [user.uid, role]);

  const announce = useCallback((n) => {
    setToasts((t) => [...t, { id: n.id, title: n.title, body: n.body }]);
    if (wantBrowser) showBrowserNotification({ title: n.title, body: n.body, tag: n.id });
  }, [wantBrowser]);

  // The reminder clock: runs only while the app is open.
  useEffect(() => {
    if (!ready || !schedules) return undefined;
    const known = new Set(items.map((n) => n.id));
    let busy = false;
    const tick = async () => {
      if (busy) return;
      busy = true;
      const due = [
        ...(wantReminders ? planReminders({ schedules, uid: user.uid, role }) : []),
        ...(wantCancellations ? planCancellations({ schedules, uid: user.uid }) : []),
      ].filter((n) => !known.has(n.id));
      for (const n of due) {
        known.add(n.id);
        try {
          // eslint-disable-next-line no-await-in-loop
          await withTimeout(createNotification(user.uid, n, permissionState()), 8000);
          announce(n);
        } catch (err) {
          if (err.message === 'timeout') announce(n);                // offline: still tell the person now
          else if (err.code !== 'permission-denied') known.delete(n.id); // duplicate (permission-denied) is skipped; other errors retry
        }
      }
      busy = false;
    };
    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [ready, schedules, items, user.uid, role, announce, wantReminders, wantCancellations]);

  const markRead = useCallback((id) => markReadDoc(id).catch(() => {}), []);
  const markAllRead = useCallback(() => Promise.all(items.filter((n) => !n.read).map((n) => markReadDoc(n.id).catch(() => {}))), [items]);
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const value = useMemo(() => ({
    items, ready, error, unread: items.filter((n) => !n.read).length, markRead, markAllRead,
  }), [items, ready, error, markRead, markAllRead]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </NotificationsContext.Provider>
  );
}
