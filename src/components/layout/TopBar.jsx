import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import UserMenu from './UserMenu.jsx';

// Search and user controls. The sidebar toggle is now inside the sidebar itself.
export default function TopBar({ navFlat, profile, role, accountItems, onSignOut, isMobile = false, menuOpen = false, onMenu }) {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (searching) inputRef.current?.focus(); }, [searching]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? navFlat.filter((i) => i.label.toLowerCase().includes(q)) : [];
  }, [query, navFlat]);

  const close = () => { setSearching(false); setQuery(''); };
  const go = (path) => { navigate(path); close(); };

  return (
    <header className="topbar">
      <div className="topbar__left">
        {isMobile && (
          <button type="button" className="icon-btn topbar__menu" onClick={onMenu} aria-label="Open navigation menu"
            aria-controls="sidebar" aria-expanded={menuOpen}>
            <Icon name="menu" />
          </button>
        )}
        <button type="button" className="icon-btn" onClick={() => setSearching((s) => !s)} aria-label="Search pages" aria-expanded={searching}>
          <Icon name="search" />
        </button>
      </div>

      {searching && (
        <div className="search" role="search">
          <input ref={inputRef} type="search" placeholder="Go to a page…" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') close(); if (e.key === 'Enter' && results[0]) go(results[0].path); }} />
          {query.trim() && (
            <ul className="search__results">
              {results.length ? results.map((r) => (
                <li key={r.path}><button type="button" onClick={() => go(r.path)}><Icon name={r.icon} size={18} />{r.label}</button></li>
              )) : <li className="search__empty">No matching page</li>}
            </ul>
          )}
        </div>
      )}

      <div className="topbar__right">
        <NotificationBell />
        <UserMenu profile={profile} role={role} items={accountItems} onSignOut={onSignOut} />
      </div>
    </header>
  );
}
