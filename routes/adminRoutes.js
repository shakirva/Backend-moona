// // routes/adminRoutes.js
// const express = require('express');
// const router = express.Router();
// const { sendNotification } = require('../controllers/adminController');

// // Send Firebase Notification (short message)
// router.post('/send-notification', sendNotification);

// module.exports = router;



const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const promotionController = require('../controllers/promotionController');

router.post('/send-promotion', upload.single('image'), promotionController.sendPromotion);
router.get('/promotions', promotionController.getPromotions);

module.exports = router;
