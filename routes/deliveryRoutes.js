const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

router.get('/', deliveryController.getAllDeliveryLocations);
router.post('/', deliveryController.createOrUpdateLocation);
router.get('/validate', deliveryController.validateDeliveryLocation);

module.exports = router;
