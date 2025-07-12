// File: routes/couponsRoutes.js

const express = require('express');
const router = express.Router();

const {
  getAllCoupons,
  createOrUpdateCoupon,
  applyCoupon,
  creditCouponCoins,
  getUserCoupons,
  deleteCoupon
} = require('../controllers/couponController');

// Admin: Get all coupons
router.get('/', getAllCoupons);

// Admin: Create or update coupon
router.post('/', createOrUpdateCoupon);

// Mobile: Get valid coupons for a user
router.get('/user/:user_id', getUserCoupons);

// Mobile: Apply a coupon
router.post('/apply', applyCoupon);

router.put('/coupons/:id', couponController.updateCoupon);
  

// Mobile: Credit coins after successful coupon application
router.post('/credit', creditCouponCoins);


router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
