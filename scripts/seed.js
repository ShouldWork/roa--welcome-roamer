/**
 * Seed script — populates Firestore with the full RVs of America catalog.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Reads catalog from data/catalog.json and writes manufacturers + models
 * to Firestore. Safe to re-run — uses merge so it won't overwrite
 * existing logoUrl/defaultImageUrl/images fields set via the admin panel.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
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

// Load catalog
const catalogPath = resolve(__dirname, '../data/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';

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

async function seed() {
  let mfgCount = 0;
  let modelCount = 0;

  // Firestore batches are limited to 500 ops — we're well under that
  const batch = writeBatch(db);

  for (const mfg of catalog.manufacturers) {
    batch.set(doc(db, 'manufacturers', mfg.id), {
      name: mfg.name,
    }, { merge: true });
    console.log(`  ✓ manufacturers/${mfg.id} — ${mfg.name}`);
    mfgCount++;

    for (const model of mfg.models) {
      batch.set(doc(db, 'models', model.id), {
        manufacturerId: mfg.id,
        name:           model.name,
      }, { merge: true });
      console.log(`    ✓ models/${model.id}`);
      modelCount++;
    }
  }

  await batch.commit();

  console.log(`\nDone. ${mfgCount} manufacturers, ${modelCount} models seeded.`);
  console.log('Add logo/image URLs in Firestore or via the admin panel.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
