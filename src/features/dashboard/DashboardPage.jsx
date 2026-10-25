import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { itemsForRole } from '../../components/layout/navConfig.js';
import Icon from '../../components/ui/Icon.jsx';

const GREETING = {
  admin: 'Manage accounts, subjects and schedules.',
  instructor: 'Your classes, attendance and grades.',
  student: 'Your classes, attendance and grades.',
};

// Phase 1 shell: shortcuts only. Live counts, today's classes and summaries come
// in Phase 13, once schedules, attendance and grades exist to read from.
export default function DashboardPage() {
  const { profile, role } = useAuth();
  const shortcuts = itemsForRole(role).flat.filter((i) => i.path !== '/dashboard' && i.phase && !['/profile', '/settings'].includes(i.path));

  return (
    <section className="page__section">
      <h1 className="page__title">Welcome, {profile?.displayName}</h1>
      <p className="muted">{GREETING[role]}</p>
      <ul className="grid">
        {shortcuts.map((item) => (
          <li key={item.path}>
            <Link to={item.path} className="card card--link">
              <Icon name={item.icon} size={24} />
              <strong>{item.label}</strong>
              <span className="muted">{item.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
