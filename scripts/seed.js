/**
 * Seed script — populates Firestore with ROA trailer manufacturer catalog.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Requires a .env file with VITE_FIREBASE_* variables (or set them in your shell).
 * Run once per new Firebase project. Safe to re-run — uses setDoc with merge:false
 * so it will overwrite existing catalog entries.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually (no dotenv dependency required)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
} catch { /* .env not found — rely on shell env */ }

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const config = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(config);
const db  = getFirestore(app);

// ─── Catalog data ────────────────────────────────────────────────────────────
// logoUrl and defaultImageUrl can be Firebase Storage download URLs or any
// publicly accessible image URL. Leave as '' to configure later in the admin panel.

const MANUFACTURERS = [
  {
    id:      'mdc',
    name:    'MDC',
    logoUrl: '',   // Add MDC logo URL here or upload via admin panel
  },
];

const MODELS = [
  {
    id:              'mdc-12-oge',
    manufacturerId:  'mdc',
    name:            'MDC 12 OGE',
    defaultImageUrl: '',  // Add trailer background image URL here
  },
  {
    id:              'mdc-xt12hr',
    manufacturerId:  'mdc',
    name:            'MDC XT12HR',
    defaultImageUrl: '',
  },
  {
    id:              'mdc-fsx-18hr',
    manufacturerId:  'mdc',
    name:            'MDC FSX 18HR',
    defaultImageUrl: '',
  },
  {
    id:              'mdc-h-series',
    manufacturerId:  'mdc',
    name:            'MDC H-Series',
    defaultImageUrl: '',
  },
];

// ─── Write to Firestore ───────────────────────────────────────────────────────
async function seed() {
  console.log('Seeding manufacturers…');
  for (const mfg of MANUFACTURERS) {
    const { id, ...data } = mfg;
    await setDoc(doc(db, 'manufacturers', id), data);
    console.log(`  ✓ manufacturers/${id}`);
  }

  console.log('Seeding models…');
  for (const model of MODELS) {
    const { id, ...data } = model;
    await setDoc(doc(db, 'models', id), data);
    console.log(`  ✓ models/${id}`);
  }

  console.log('\nDone. Add image URLs directly in Firestore or via the admin panel.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
