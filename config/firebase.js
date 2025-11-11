const admin = require('firebase-admin');
const db = require('./db');

let initialized = false;

async function initializeFirebase() {
  if (initialized) return admin;
  try {
    // Column appears spelled 'firbase_config' in current schema
    const [rows] = await db.query('SELECT firbase_config FROM general_settings LIMIT 1');
    if (!rows.length) throw new Error('Firebase config not found in DB');
    const firebaseConfig = JSON.parse(rows[0].firbase_config);
    admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });
    initialized = true;
    console.log('✅ Firebase initialized');
    return admin;
  } catch (err) {
    console.error('❌ Firebase init failed:', err.message || err);
    throw err;
  }
}

module.exports = { initializeFirebase };
