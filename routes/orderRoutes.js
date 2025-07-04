const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Shopify Webhook Routes
router.post('/create', orderController.createOrderWebhook);
router.post('/update', orderController.updateOrderWebhook);

// Existing route for order details
router.get('/:orderId', orderController.getOrderById); // You can move logic to controller

module.exports = router;
