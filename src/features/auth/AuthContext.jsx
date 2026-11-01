import { profileName } from '../../lib/profile.js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../../firebase/firebase.js';
import { signOutUser } from '../../firebase/auth.js';
import { setActivityActor } from '../activity/services/activityService.js';

const AuthContext = createContext(null);
export const VALID_ROLES = ['admin', 'instructor', 'student'];
const SIGNED_OUT = { loading: false, user: null, role: null, profile: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ...SIGNED_OUT, loading: isFirebaseConfigured, error: '' });

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setActivityActor(null);
        setState((s) => ({ ...s, ...SIGNED_OUT }));
        return;
      }
      try {
        // The role lives in users/{uid}. Firestore rules stop users editing their own role;
        // only Admins can create or change it.
        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        const role = profile?.role;

        if (!VALID_ROLES.includes(role) || !profile) {
          await signOutUser();
          setState({ ...SIGNED_OUT, error: 'Your account has no assigned role. Contact the school administrator.' });
          return;
        }
        if (profile.status !== 'active') {
          await signOutUser();
          setState({ ...SIGNED_OUT, error: 'This account is deactivated. Contact the school administrator.' });
          return;
        }
        setActivityActor({ uid: user.uid, name: profileName(profile), role });
        setState({ loading: false, user, role, profile, error: '' });
      } catch {
        await signOutUser();
        setState({ ...SIGNED_OUT, error: 'Could not load your account. Check your connection and try again.' });
      }
    });
  }, []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: '' })), []);
  // After saving profile or preference changes, keep the in-memory profile current without a reload.
  const updateProfileState = useCallback((patch) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })), []);
  const value = useMemo(() => ({ ...state, clearError, updateProfileState, signOut: signOutUser }), [state, clearError, updateProfileState]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
