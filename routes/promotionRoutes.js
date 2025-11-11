// routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const promotionController = require('../controllers/promotionController');

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists and is served statically
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ POST /api/promotion/send-promotion (with file upload)
router.post(
  '/send-promotion',
  upload.single('file'), // <== middleware for file upload (field name is 'file')
  promotionController.sendPromotion
);

// ✅ GET /api/promotion/all
router.get('/all', promotionController.all);

module.exports = router;
