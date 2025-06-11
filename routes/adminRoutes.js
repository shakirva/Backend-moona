// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/adminController');

// Send Firebase Notification (short message)
router.post('/send-notification', sendNotification);

module.exports = router;
