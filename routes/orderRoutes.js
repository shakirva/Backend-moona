const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController');

// Shopify Webhook Routes
router.post('/create', orderController.createOrderWebhook);
router.post('/update', orderController.updateOrderWebhook);
router.post('/update-device-id', userController.updateDeviceId);

// ✅ Get All Orders (with pagination)
router.get('/', orderController.getAllOrders);

// ✅ Get Order by ID (keep this last to avoid route conflicts)
router.get('/:orderId', orderController.getOrderById);

module.exports = router;
