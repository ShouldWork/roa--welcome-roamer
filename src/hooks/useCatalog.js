import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useCatalog() {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels]               = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, 'manufacturers')),
      getDocs(collection(db, 'models')),
    ]).then(([mfgSnap, modelSnap]) => {
      setManufacturers(mfgSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setModels(modelSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  return { manufacturers, models, loading };
}
