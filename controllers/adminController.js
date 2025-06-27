// // controllers/adminController.js
// const admin = require('firebase-admin');
// const db = require('../db'); // adjust path if different

// exports.sendNotification = async (req, res) => {
//   const { title, message } = req.body;

//   if (!title || !message) {
//     return res.status(400).json({ error: 'Title and message are required' });
//   }

//   try {
//     const [users] = await db.query('SELECT mobile_device_id FROM users WHERE mobile_device_id IS NOT NULL');

//     const tokens = users.map(user => user.mobile_device_id).filter(Boolean);

//     const payload = {
//       notification: {
//         title,
//         body: message,
//       }
//     };

//     const response = await admin.messaging().sendEachForMulticast({
//       tokens,
//       ...payload
//     });

//     return res.status(200).json({ success: true, sent: response.successCount, failed: response.failureCount });
//   } catch (err) {
//     console.error('Notification Error:', err);
//     return res.status(500).json({ error: 'Server error while sending notification' });
//   }
// };




const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

// POST /api/admin/send-promotion
exports.sendPromotion = async (req, res) => {
  try {
    const { title, body } = req.body;
    const image = req.file;

    if (!image || !title || !body) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const imageUrl = `/uploads/${image.filename}`;

    // 1. Save promotion to database
    await pool.query(
      'INSERT INTO promotions (title, body, image_url) VALUES (?, ?, ?)',
      [title, body, imageUrl]
    );

    // 2. Get all Shopify IDs from users table
    const [users] = await pool.query('SELECT shopify_id FROM users');
    const shopifyIds = users.map((user) => user.shopify_id);

    // 3. Log: Broadcast to each user (simulate or integrate with notification/email system)
    console.log('Promotion sent to:', shopifyIds);

    res.json({ success: true, message: 'Promotion sent to all customers' });
  } catch (error) {
    console.error('Error sending promotion:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
