const express = require('express');
const router = express.Router();
const controller = require('../controllers/pointsRulesController');

// Admin Routes
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// Mobile API Routes
router.post('/mobile/credit', controller.creditPointsFlow);  // ✅ Credits and debits based on order
router.get('/mobile/history/:user_id', controller.getUserHistory); // ✅ Transaction history

module.exports = router;
