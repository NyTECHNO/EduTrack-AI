import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Frontend guard only (UX). Real enforcement lives in Firestore rules and Cloud Functions.
export default function ProtectedRoute({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="splash" role="status">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children ?? <Outlet />;
}
