const express = require('express');
const router = express.Router();
const shopifyController = require('../controllers/shopifyController');

router.post('/order-created', shopifyController.handleOrderCreate);

module.exports = router;
