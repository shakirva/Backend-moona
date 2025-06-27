// routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/coin-history', walletController.getCoinHistory);
router.get('/orders/:orderId', walletController.getOrderDetails);

module.exports = router;
