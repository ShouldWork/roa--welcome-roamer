/**
 * Seed script — provisions dealer locations in Firestore.
 *
 * Usage:
 *   node scripts/seed-location.js
 *
 * Edit the LOCATIONS array below to add your dealer locations.
 * Each location needs a unique ID, a display name, and the Google
 * email addresses that should have admin access.
 *
 * Safe to re-run — uses merge so it won't overwrite ownerEmails,
 * activePageId, or other fields that may have been modified in-app.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) process.env[key] = val;
  }
} catch { /* .env not found — rely on shell env */ }

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const config = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

if (!config.projectId) {
  console.error('Missing VITE_FIREBASE_PROJECT_ID. Check your .env file.');
  process.exit(1);
}

const app = initializeApp(config);
const db  = getFirestore(app);

// ─── Dealer locations ──────────────────────────────────────────────────────────
// Add your locations here. Each email in ownerEmails gets full admin access
// to that location's pages and display.

const LOCATIONS = [
  {
    id:          'south-carolina',
    name:        'ROA Off-Road — South Carolina',
    ownerEmails: [],
    theme:       'ember',
  },
  {
    id:          'arizona',
    name:        'ROA Off-Road — Arizona',
    ownerEmails: [],
    theme:       'crimson',
  },
  {
    id:          'colorado',
    name:        'ROA Off-Road — Colorado',
    ownerEmails: [],
    theme:       'forge',
  },
  {
    id:          'utah',
    name:        'ROA Off-Road — Utah',
    ownerEmails: [],
    theme:       'arctic',
  },
];

// ─── Write to Firestore ────────────────────────────────────────────────────────
async function seed() {
  console.log('Provisioning dealer locations…\n');

  const batch = writeBatch(db);

  for (const loc of LOCATIONS) {
    const { id, ownerEmails, ...data } = loc;
    const ref = doc(db, 'locations', id);
    const existing = await getDoc(ref);

    if (existing.exists()) {
      // Only update name/theme — preserve ownerEmails, activePageId, createdAt
      batch.set(ref, data, { merge: true });
      console.log(`  ↻ locations/${id} (updated name/theme, preserved existing data)`);
    } else {
      // New location — set all fields including ownerEmails and createdAt
      batch.set(ref, {
        ...data,
        ownerEmails,
        activePageId: null,
        createdAt: serverTimestamp(),
      });
      console.log(`  ✓ locations/${id} (created)`);
    }
    console.log(`    name:  ${data.name}\n`);
  }

  await batch.commit();

  console.log('Done. Each location can now sign in and create welcome pages.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
