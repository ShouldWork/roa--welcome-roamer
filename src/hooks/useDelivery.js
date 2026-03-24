import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

const DELIVERY_REF = () => doc(db, 'delivery', 'current');

const DEFAULT_DELIVERY = {
  roamers:        [{ id: 1, name: '' }],
  dealer:         'ROA Off-Road',
  firstAdventure: '',
  upgrades:       [],
  manufacturerId: '',
  modelId:        '',
  theme:          'ember',
};

export function useDelivery() {
  const [delivery, setDeliveryState] = useState(null);
  const [loading, setLoading]        = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(DELIVERY_REF(), snap => {
      if (snap.exists()) {
        setDeliveryState(snap.data());
      } else {
        // First run — seed defaults
        setDoc(DELIVERY_REF(), { ...DEFAULT_DELIVERY, updatedAt: serverTimestamp() });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setDelivery = data => {
    const payload = { ...data, updatedAt: serverTimestamp() };
    setDoc(DELIVERY_REF(), payload);
  };

  return { delivery, setDelivery, loading };
}
