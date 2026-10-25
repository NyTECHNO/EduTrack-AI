import { useAuth } from '../../auth/AuthContext.jsx';
import NotificationSettings from '../components/NotificationSettings.jsx';
import PasswordForm from '../components/PasswordForm.jsx';
import Switch from '../components/Switch.jsx';
import useLocalStorage from '../../../hooks/useLocalStorage.js';
import useTheme from '../../../hooks/useTheme.js';

export default function SettingsPage() {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorage('edutrack.sidebarCollapsed', false);
  const [theme, setTheme] = useTheme();

  return (
    <section className="page__section">
      <h1 className="page__title">Settings</h1>
      <div className="settings">
        {role !== 'admin' && <NotificationSettings />}
        <div className="card stack">
          <h2 className="section-title">Appearance</h2>
          <fieldset className="fieldset">
            <legend className="switchrow__legend">Theme</legend>
            <div className="seg">
              {[['system', 'System default'], ['light', 'Light'], ['dark', 'Dark']].map(([key, label]) => (
                <label key={key} className="seg__opt seg__opt--excused">
                  <input type="radio" name="theme" value={key} checked={theme === key} onChange={() => setTheme(key)} /><span>{label}</span>
                </label>
              ))}
            </div>
            <p className="muted small">“System default” follows your device. This choice is remembered on this device.</p>
          </fieldset>
          <Switch id="pref-sidebar" label="Keep the sidebar collapsed" hint="On computers and tablets. This is remembered on this device." checked={Boolean(collapsed)} onChange={setCollapsed} />
        </div>
        <PasswordForm />
      </div>
    </section>
  );
}
