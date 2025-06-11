const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// ➕ Credit coins
router.post('/credit', walletController.creditCoins);

// ➖ Apply coins
router.post('/apply', walletController.applyCoins);

// 📜 Coin history
router.get('/coins-history', walletController.getCoinHistory);

// 🔍 Check available coins
router.get('/check', walletController.checkCoins);

module.exports = router;
