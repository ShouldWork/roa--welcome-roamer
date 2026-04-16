import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '../firebase.js';

const provider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Resolve any pending redirect on page load
  useEffect(() => {
    getRedirectResult(auth).catch(err => {
      // auth/popup-closed-by-user and auth/cancelled-popup-request are
      // user-initiated and don't need to surface as errors
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(err.code)) {
        console.error('Redirect sign-in error:', err);
        setAuthError(err.message);
      }
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn  = useCallback(() => signInWithRedirect(auth, provider), []);
  const signOut = useCallback(() => fbSignOut(auth), []);

  return { user, loading, authError, signIn, signOut };
}
