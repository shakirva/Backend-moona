const admin = require('firebase-admin');
const db = require('./db');

// Single App reference to prevent multiple initializations
let firebaseApp = null;

/**
 * Initialize Firebase Admin using config stored in DB.
 * Supports both `firebase_config` (correct) and legacy typo `firbase_config`.
 * Returns the admin instance after ensuring one-time initialization.
 */
async function initializeFirebase() {
  if (firebaseApp) return admin;
  try {
    const [rows] = await db.query(
      'SELECT firebase_config, firbase_config FROM general_settings LIMIT 1'
    );
    if (!rows.length) throw new Error('Firebase config not found in DB');
    const row = rows[0];
    const rawConfig = row.firebase_config || row.firbase_config;
    if (!rawConfig) throw new Error('No firebase configuration column present');

    const firebaseConfig = JSON.parse(rawConfig);
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });

    console.log('✅ Firebase initialized', firebaseConfig.project_id ? `for project: ${firebaseConfig.project_id}` : '');
    return admin;
  } catch (err) {
    console.error('❌ Firebase init failed:', err.message || err);
    throw err;
  }
}

module.exports = { admin, initializeFirebase };
