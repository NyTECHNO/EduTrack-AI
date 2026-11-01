import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { profileInitial, profileName } from '../../lib/profile.js';
import { accountLabel } from '../../lib/studentId.js';

const ROLE_LABEL = { admin: 'Administrator', instructor: 'Instructor', student: 'Student' };

// The name in the header opens this menu: Profile, Settings and Log out. Fully keyboard operable.
export default function UserMenu({ profile, role, items, onSignOut }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const panel = useRef(null);

  const close = (returnFocus = false) => { setOpen(false); if (returnFocus) trigger.current?.focus(); };
  const entries = () => [...(panel.current?.querySelectorAll('[role="menuitem"]') || [])];

  useEffect(() => {
    if (!open) return undefined;
    entries()[0]?.focus();
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function onMenuKeyDown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); close(true); return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    const list = entries();
    const at = list.indexOf(document.activeElement);
    const go = (i) => { e.preventDefault(); list[(i + list.length) % list.length]?.focus(); };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(list.length - 1);
  }

  const who = accountLabel(profile);

  return (
    <div className="usermenu" ref={root}>
      <button ref={trigger} type="button" className="userchip" aria-haspopup="menu" aria-expanded={open} aria-controls="user-menu"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } }}>
        <span className="userchip__avatar" aria-hidden="true">{profileInitial(profile)}</span>
        <span className="userchip__text">
          <strong>{profileName(profile)}</strong>
          <small>{role}</small>
        </span>
        <Icon name="chevronDown" size={18} className="userchip__chevron" />
      </button>

      {open && (
        <div id="user-menu" ref={panel} className="usermenu__panel" role="menu" aria-label="Account" onKeyDown={onMenuKeyDown}>
          <div className="usermenu__head">
            <strong>{profileName(profile)}</strong>
            <span>{ROLE_LABEL[role] || role}{who && who !== profileName(profile) ? ` · ${who}` : ''}</span>
          </div>
          {items.map((item) => (
            <Link key={item.path} to={item.path} role="menuitem" className="usermenu__item" onClick={() => setOpen(false)}>
              <Icon name={item.icon} size={18} />{item.label}
            </Link>
          ))}
          <div className="usermenu__sep" role="separator" />
          <button type="button" role="menuitem" className="usermenu__item usermenu__item--danger" onClick={() => { setOpen(false); onSignOut(); }}>
            <Icon name="logout" size={18} />Log out
          </button>
        </div>
      )}
    </div>
  );
}
