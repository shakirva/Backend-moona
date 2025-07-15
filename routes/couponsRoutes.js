// File: routes/couponsRoutes.js

const express = require('express');
const router = express.Router();

const {
  getAllCoupons,
  createOrUpdateCoupon,
  applyCoupon,
  creditCouponCoins,
  getUserCoupons,
  deleteCoupon,
  updateCoupon,
} = require('../controllers/couponController');

// Admin panel
router.get('/', getAllCoupons);
router.post('/', createOrUpdateCoupon);
router.put('/:id', updateCoupon);             // ✅ Fix: Add update route
router.delete('/:id', deleteCoupon);          // ✅ Fix: Add delete route

// Mobile app
router.get('/user/:user_id', getUserCoupons);
router.post('/apply', applyCoupon);
router.post('/credit', creditCouponCoins);

router.get('/test', (req, res) => {
  res.send('Coupons route working');
});


console.log('✅ couponsRoutes loaded');



module.exports = router;
