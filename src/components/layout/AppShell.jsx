import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { itemsForRole } from './navConfig.js';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import { NotificationsProvider } from '../../features/reminders/NotificationsProvider.jsx';
import useLocalStorage from '../../hooks/useLocalStorage.js';
import useMediaQuery from '../../hooks/useMediaQuery.js';

function Shell() {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 59.99rem)');
  const [collapsed, setCollapsed] = useLocalStorage('edutrack.sidebarCollapsed', false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const nav = useMemo(() => itemsForRole(role), [role]);

  // Drawer never stays open across page changes or when resizing to desktop.
  useEffect(() => setDrawerOpen(false), [location.pathname, isMobile]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const toggle = () => (isMobile ? setDrawerOpen((o) => !o) : setCollapsed((c) => !c));
  const handleSignOut = async () => { await signOut(); navigate('/login', { replace: true }); };

  return (
    <div className={`shell${collapsed && !isMobile ? ' shell--rail' : ''}`}>
      <a className="skip-link" href="#content">Skip to content</a>
      <Sidebar nav={nav} collapsed={collapsed} isMobile={isMobile} open={drawerOpen}
        onExpand={() => setCollapsed(false)} onClose={() => setDrawerOpen(false)} onSignOut={handleSignOut} />
      <div className="shell__main">
        <TopBar onToggle={toggle} navFlat={nav.flat} profile={profile} role={role}
          sidebarExpanded={isMobile ? drawerOpen : !collapsed} />
        <main className="page" id="content" tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  );
}

// The provider wraps the whole shell so the bell, the toasts and the reminder clock share one live notification list.
export default function AppShell() {
  return (
    <NotificationsProvider>
      <Shell />
    </NotificationsProvider>
  );
}
