import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useActivePage(locationId, activePageId) {
  const [page, setPage]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId || !activePageId) {
      setPage(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'locations', locationId, 'pages', activePageId),
      snap => {
        setPage(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      err => {
        console.error('Active page listener error:', err);
        setPage(null);
        setLoading(false);
      }
    );
    return unsub;
  }, [locationId, activePageId]);

  return { page, loading };
}
