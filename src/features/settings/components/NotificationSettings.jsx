import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import Switch from './Switch.jsx';
import { savePreferences } from '../services/settingsService.js';
import { getNotificationPrefs } from '../../../lib/preferences.js';
import { askPermission, permissionState } from '../../../lib/browserNotify.js';

export default function NotificationSettings() {
  const { user, profile, updateProfileState } = useAuth();
  const prefs = getNotificationPrefs(profile);
  const [permission, setPermission] = useState(permissionState());
  const [status, setStatus] = useState('');

  async function update(key, value) {
    const preferences = { ...(profile.preferences || {}), notifications: { ...prefs, [key]: value } };
    updateProfileState({ preferences }); // optimistic, so the switch responds at once
    setStatus('');
    try { await savePreferences(user.uid, preferences); setStatus('Saved.'); }
    catch { updateProfileState({ preferences: profile.preferences || {} }); setStatus('Could not save. Check your connection and try again.'); }
  }

  return (
    <div className="card stack">
      <h2 className="section-title">Notifications</h2>
      <div>
        <Switch id="pref-reminders" label="Class reminders" hint="30 minutes before each class." checked={prefs.classReminders} onChange={(v) => update('classReminders', v)} />
        <Switch id="pref-cancel" label="Cancellation notices" hint="When one of your classes is cancelled." checked={prefs.cancellations} onChange={(v) => update('cancellations', v)} />
        <Switch id="pref-browser" label="Browser notifications" hint="Pop-ups on this device while EduTrack AI is open." checked={prefs.browser} onChange={(v) => update('browser', v)} />
      </div>
      <div className="stack">
        {permission === 'default' && <div><button type="button" className="btn btn--ghost btn--small" onClick={async () => setPermission(await askPermission())}>Allow notifications on this device</button></div>}
        {permission === 'granted' && <p className="muted small">This browser allows notifications.</p>}
        {permission === 'denied' && <p className="muted small">This browser has blocked notifications. Allow them in the site settings of your browser (the lock icon beside the address).</p>}
        {permission === 'unsupported' && <p className="muted small">This browser does not support notifications.</p>}
        <p className="muted small">Reminders appear while EduTrack AI is open in a browser tab or as an installed app.</p>
        {status && <p className="small" role="status">{status}</p>}
      </div>
    </div>
  );
}
