


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
