// routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

// POST /api/promotion/send-promotion
router.post(
  '/send-promotion',
  promotionController.uploadMiddleware,
  promotionController.sendPromotion
);

router.get('/all', promotionController.all);

module.exports = router; // ✅ Must export the router directly
