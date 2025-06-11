// controllers/adminController.js
const admin = require('firebase-admin');
const db = require('../db'); // adjust path if different

exports.sendNotification = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  try {
    const [users] = await db.query('SELECT mobile_device_id FROM users WHERE mobile_device_id IS NOT NULL');

    const tokens = users.map(user => user.mobile_device_id).filter(Boolean);

    const payload = {
      notification: {
        title,
        body: message,
      }
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      ...payload
    });

    return res.status(200).json({ success: true, sent: response.successCount, failed: response.failureCount });
  } catch (err) {
    console.error('Notification Error:', err);
    return res.status(500).json({ error: 'Server error while sending notification' });
  }
};
