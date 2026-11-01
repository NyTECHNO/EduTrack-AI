import { NavLink } from 'react-router-dom';
import logo from '../../assets/logos/jpc-logo-128.png';
import Icon from '../ui/Icon.jsx';

// Collapsed rail shows icons only. The toggle button lives inside the sidebar
// so it is always visible in both expanded and rail states.
export default function Sidebar({ nav, collapsed, isMobile, open, onToggle, onExpand, onClose }) {
  const rail = collapsed && !isMobile;
  const stop = (e) => e.stopPropagation();
  const handleNavigate = (e) => { stop(e); if (isMobile) onClose(); };

  const renderItem = (item) => (
    <li key={item.path}>
      <NavLink to={item.path} className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}
        onClick={handleNavigate} title={rail ? item.label : undefined} aria-label={item.label}>
        <Icon name={item.icon} />
        <span className="nav__label">{item.label}</span>
      </NavLink>
    </li>
  );

  return (
    <>
      {isMobile && open && <div className="scrim" onClick={onClose} aria-hidden="true" />}
      <aside id="sidebar" className={`sidebar${rail ? ' is-rail' : ''}${isMobile ? ' is-drawer' : ''}${open ? ' is-open' : ''}`}
        aria-label="Main navigation">
        <div className="sidebar__brand">
          {/* Toggle button: collapses/expands on desktop, opens/closes drawer on mobile */}
          <button type="button" className="icon-btn sidebar__toggle" onClick={(e) => { stop(e); onToggle(); }}
            aria-label={rail ? 'Expand navigation' : 'Collapse navigation'} aria-controls="sidebar">
            <Icon name="menu" />
          </button>
          <img src={logo} alt="John Paul College seal" width="40" height="40" className="sidebar__logo" />
          <div className="sidebar__title">
            <strong>JOHN PAUL COLLEGE</strong>
            <span>EduTrack AI</span>
          </div>
          {isMobile && (
            <button type="button" className="icon-btn sidebar__close" onClick={(e) => { stop(e); onClose(); }} aria-label="Close navigation">
              <Icon name="x" />
            </button>
          )}
        </div>

        <nav className="nav">
          {nav.groups.map((group) => (
            <div className="nav__group" key={group.label}>
              <p className="nav__heading">{group.label}</p>
              <ul>{group.items.map(renderItem)}</ul>
            </div>
          ))}
        </nav>

      </aside>
    </>
  );
}
