import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useCatalog() {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const loaded = useRef({ mfg: false, models: false });

  useEffect(() => {
    loaded.current = { mfg: false, models: false };

    const checkDone = () => {
      if (loaded.current.mfg && loaded.current.models) setLoading(false);
    };

    const unsubMfg = onSnapshot(
      collection(db, 'manufacturers'),
      snap => {
        setManufacturers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        loaded.current.mfg = true;
        checkDone();
      },
      err => {
        console.error('Manufacturers listener error:', err);
        setError(err);
        loaded.current.mfg = true;
        checkDone();
      }
    );

    const unsubModels = onSnapshot(
      collection(db, 'models'),
      snap => {
        setModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        loaded.current.models = true;
        checkDone();
      },
      err => {
        console.error('Models listener error:', err);
        setError(err);
        loaded.current.models = true;
        checkDone();
      }
    );

    return () => {
      unsubMfg();
      unsubModels();
    };
  }, []);

  return { manufacturers, models, loading, error };
}
