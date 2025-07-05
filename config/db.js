// 📁 config/db.js
const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Moona@123', // 🔒 Your MySQL password
  database: 'moona_shopify',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL (Promise pool)');
    connection.release();
  } catch (err) {
    console.error('❌ Failed to connect to MySQL (Promise pool):', err.message);
  }
})();

module.exports = pool;
