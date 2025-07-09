const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.post('/apply-points', walletController.applyPoints);
router.get('/available-points/:shopify_id', walletController.getAvailablePoints);

module.exports = router;
