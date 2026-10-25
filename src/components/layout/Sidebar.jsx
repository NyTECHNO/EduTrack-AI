import { NavLink } from 'react-router-dom';
import logo from '../../assets/logos/jpc-logo-128.png';
import Icon from '../ui/Icon.jsx';

// Collapsed rail shows icons only. Clicking a link navigates without expanding
// (stopPropagation); clicking blank rail space expands it, like ChatGPT's sidebar.
export default function Sidebar({ nav, collapsed, isMobile, open, onExpand, onClose, onSignOut }) {
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
        onClick={() => rail && onExpand()} aria-label="Main navigation">
        <div className="sidebar__brand">
          <img src={logo} alt="John Paul College seal" width="40" height="40" />
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

        <div className="sidebar__foot">
          <ul>
            {nav.account.map(renderItem)}
            <li>
              <button type="button" className="nav__link nav__link--button" title={rail ? 'Log out' : undefined}
                onClick={(e) => { stop(e); onSignOut(); }}>
                <Icon name="logout" />
                <span className="nav__label">Log out</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
