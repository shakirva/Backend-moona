const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Admin APIs
router.get('/', userController.getUsers); // GET /api/users
router.get('/sync-shopify', userController.syncShopifyCustomers); // GET /api/users/sync-shopify

// Mobile APIs
router.post('/create', userController.createUser); // POST /api/user/create
router.post('/address/save', userController.saveAddress); // POST /api/user/address/save
router.get('/address/get_all', userController.getAllAddresses); // GET /api/user/address/get_all
router.post('/update-address', userController.updateAddress); // You can update this later



// Shopify Webhooks
router.post('/create/hook', userController.createUserWebhook);  // POST /api/users/create
router.post('/update/hook', userController.updateUserWebhook);  // POST /api/users/update


module.exports = router;


