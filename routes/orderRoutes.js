const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController'); // ✅ FIXED

// Shopify Webhook Routes
router.post('/create', orderController.createOrderWebhook);
router.post('/update', orderController.updateOrderWebhook);
router.post('/update-device-id', userController.updateDeviceId); // ✅ Now this works

// Existing route for order details
router.get('/:orderId', orderController.getOrderById);

module.exports = router;
