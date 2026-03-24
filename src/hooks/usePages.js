import { useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';
import { DEFAULT_PAGE } from '../constants.js';

export function usePages(locationId) {
  const [pages, setPages]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId) { setLoading(false); return; }

    const q = query(
      collection(db, 'locations', locationId, 'pages'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error('Pages listener error:', err);
      setLoading(false);
    });
    return unsub;
  }, [locationId]);

  const createPage = useCallback(async (data = {}) => {
    if (!locationId) return null;
    const ref = doc(collection(db, 'locations', locationId, 'pages'));
    await setDoc(ref, {
      ...DEFAULT_PAGE,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }, [locationId]);

  const updatePage = useCallback(async (pageId, data) => {
    if (!locationId) return;
    await updateDoc(doc(db, 'locations', locationId, 'pages', pageId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }, [locationId]);

  const removePage = useCallback(async (pageId) => {
    if (!locationId) return;
    await deleteDoc(doc(db, 'locations', locationId, 'pages', pageId));
  }, [locationId]);

  return { pages, loading, createPage, updatePage, removePage };
}
