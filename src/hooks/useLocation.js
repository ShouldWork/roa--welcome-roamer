import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, query, where, limit,
  onSnapshot, updateDoc, setDoc, getDoc, getDocs,
  arrayUnion, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

export function useLocation(user) {
  const [location, setLocation]         = useState(null);
  const [locationId, setLocationId]     = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // ── Step 1: Resolve user → locationId from Firestore ──
  // Priority: users/{uid}.locationId → ownerEmails query → show picker
  useEffect(() => {
    if (!user?.uid || !user?.email) {
      // Signed out — reset all state
      setLocation(null);
      setLocationId(null);
      setAllLocations([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function resolve() {
      // 1. Direct lookup: users/{uid} doc (fast, no query)
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (!cancelled && userSnap.exists() && userSnap.data().locationId) {
          setLocationId(userSnap.data().locationId);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('users/{uid} lookup failed, falling back to query:', err);
      }

      // 2. Fallback: ownerEmails query (backwards compat)
      try {
        const q = query(
          collection(db, 'locations'),
          where('ownerEmails', 'array-contains', user.email),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          const locId = snap.docs[0].id;
          setLocationId(locId);
          // Migrate: create users/{uid} doc so future logins are instant
          try {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              locationId: locId,
              joinedAt: serverTimestamp(),
            });
          } catch (migErr) {
            console.warn('Migration write to users/{uid} failed:', migErr);
          }
          if (!cancelled) setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('ownerEmails query failed:', err);
      }

      // 3. No location found — show picker
      if (cancelled) return;
      setError('no-location');
      try {
        const all = await getDocs(collection(db, 'locations'));
        if (!cancelled) {
          setAllLocations(all.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error('Failed to fetch locations list:', err);
      }
      if (!cancelled) setLoading(false);
    }

    resolve();
    return () => { cancelled = true; };
  }, [user?.uid, user?.email]);

  // ── Step 2: Subscribe to the resolved location doc ──
  useEffect(() => {
    if (!locationId) return;

    const unsub = onSnapshot(
      doc(db, 'locations', locationId),
      snap => {
        if (snap.exists()) {
          setLocation({ id: snap.id, ...snap.data() });
        } else {
          setLocation(null);
          setLocationId(null);
        }
      },
      err => {
        console.error('Location listener error:', err);
      }
    );
    return unsub;
  }, [locationId]);

  // ── Update fields on the location doc (theme, activePageId, etc.) ──
  const updateLocation = useCallback(async (data) => {
    if (!locationId) return;
    await updateDoc(doc(db, 'locations', locationId), data);
  }, [locationId]);

  // ── First-time location selection ──
  // Writes users/{uid} (persistent mapping) AND adds email to ownerEmails
  const joinLocation = useCallback(async (locId) => {
    if (!user?.uid || !user?.email) return;

    // Write the persistent user→location mapping
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      locationId: locId,
      joinedAt: serverTimestamp(),
    });

    // Add email to the location's ownerEmails for authorization
    await updateDoc(doc(db, 'locations', locId), {
      ownerEmails: arrayUnion(user.email),
    });

    // Update local state immediately (no need to wait for re-query)
    setLocationId(locId);
    setError(null);
  }, [user?.uid, user?.email]);

  return { location, locationId, allLocations, loading, error, updateLocation, joinLocation };
}
