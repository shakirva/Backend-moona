const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers); // GET /api/users
router.get('/sync-shopify', userController.syncShopifyCustomers); // GET /api/users/sync-shopify

module.exports = router;
