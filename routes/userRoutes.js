const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ✅ GET all users with Shopify data
router.get('/', userController.getUsers);

// ✅ POST to create or update user
router.post('/', userController.saveUser);

// ✅ NEW: Sync Shopify customers to local DB
router.get('/sync-shopify', userController.syncShopifyCustomers);

module.exports = router;
