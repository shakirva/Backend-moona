// routes/shopifyRoutes.js
const express = require('express');
const router = express.Router();
const shopifyController = require('../controllers/shopifyController');

// Route to get all orders with pagination, search, filter
router.get('/orders', shopifyController.getAllOrders);

module.exports = router;
