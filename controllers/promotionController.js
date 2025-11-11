const { initializeFirebase } = require('../config/firebase'); // Lazy Firebase initializer
const db = require('../config/db'); // DB connection (mysql2/promise expected)
const multer = require('multer');
const path = require('path');
const upload = require('../middleware/upload'); // Central upload middleware (already configured elsewhere)

// Field upload middleware (relies on existing configuration in middleware/upload.js)
exports.uploadMiddleware = upload.single('image');

// Default image when none uploaded
const DEFAULT_IMAGE_URL = 'https://cdn-icons-png.flaticon.com/512/4138/4138124.png';

// Helper: chunk an array (FCM max 500 tokens per multicast request)
function chunkArray(arr, size = 500) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

exports.sendPromotion = async (req, res) => {
  try {
    const { title, body } = req.body;
    const file = req.file;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    // Derive image URL (uploaded or default)
    const imageUrl = file && file.filename
      ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      : DEFAULT_IMAGE_URL;

    // Persist promotion first
    const [result] = await db.query(
      'INSERT INTO promotions (title, body, image_url) VALUES (?, ?, ?)',
      [title, body, imageUrl]
    );
    console.log('Promotion saved. InsertId:', result.insertId);

    // Fetch device tokens
    const [users] = await db.query('SELECT device_id FROM users WHERE device_id IS NOT NULL');
    const tokens = users.map(u => u.device_id).filter(Boolean);

    if (!tokens.length) {
      return res.status(200).json({ message: 'Promotion saved, but no users to notify.' });
    }

    // Prepare base message (will add tokens per chunk)
    const baseMessage = {
      notification: { title, body },
      android: { notification: { imageUrl } },
      apns: {
        payload: { aps: { 'mutable-content': 1 } },
        fcm_options: { image: imageUrl }
      }
    };

    const tokenChunks = chunkArray(tokens, 500);
    let aggregateSuccess = 0;
    let aggregateFailure = 0;
    const responsesDetail = [];

    const adminInstance = await initializeFirebase();
    for (const chunk of tokenChunks) {
      const multicastMessage = { ...baseMessage, tokens: chunk };
      const response = await adminInstance.messaging().sendMulticast(multicastMessage);
      aggregateSuccess += response.successCount;
      aggregateFailure += response.failureCount;
      responsesDetail.push(...response.responses);
    }

    return res.status(200).json({
      message: 'Promotion sent successfully',
      successCount: aggregateSuccess,
      failureCount: aggregateFailure,
      totalTokens: tokens.length,
      batches: tokenChunks.length
    });
  } catch (error) {
    console.error('Promotion error:', error);
    return res.status(500).json({ error: 'Failed to send promotion' });
  }
};

exports.all = async (req, res) => {
  const { pageNo, perPage } = req.query;
  console.log('=======================', req.query);
  console.log(pageNo, perPage);
  
  try {
    const [rows] = await db.query(`SELECT * FROM promotions LIMIT ? OFFSET ?`, [Number(perPage), ((Number(pageNo) - 1) * Number(perPage))]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
