


const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const promotionController = require('../controllers/promotionController');

router.post('/send-promotion', upload.single('image'), promotionController.sendPromotion);
router.get('/promotions', promotionController.getPromotions);

module.exports = router;
