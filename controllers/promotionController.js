const admin = require('../config/firebase'); // Firebase config
const db = require('../config/db'); // Your DB connection
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload'); // Upload middleware for handling file uploads

// Save uploaded image locally (or to cloud storage if you prefer)
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // e.g., 1623337891234.jpg
    console.log('File uploaded:', file.originalname);
    console.log("pathextention", path.extname(file.originalname));
  }
});

exports.uploadMiddleware = upload.single('image');

exports.sendPromotion = async (req, res) => {
  try {
    const { title, body } = req.body;
    const file = req.file;

    if (!title || !body) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

if (!file){
      return res.status

    }


    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    console.log('Image URL:', file.originalname);

    

    const [messege_data] = await db.query('INSERT INTO promotions (title, body, image_url) VALUES (?, ?, ?)', [title, body, imageUrl]);
    console.log('Promotion saved:', messege_data);
  

    console.log('Image URL:', imageUrl);
    // Get all users with device tokens
    const [users] = await db.query('SELECT device_id FROM users WHERE device_id IS NOT NULL');
    const tokens = users.map(u => u.device_id);

    if (!tokens.length) {
      return res.status(200).json({ message: 'No users to notify' });
    }

    // Send promotion push notification
    const message = {
      notification: { title: title, body: body },
      token: tokens,
      android: {
        notification: {
          imageUrl,
        }
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1,
          },
        },
        fcm_options: {
          image: imageUrl,
        },
      },
    };

    if (file) {
      message.notification.image = imageUrl;
    }

    

    const response = await admin.initializeFirebase().then(result).messaging().sendMulticast(message);
    console.log('Promotion sent:', response);

    return res.status(200).json({
      message: 'Promotion sent successfully',
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (error) {
    console.error('Promotion error:', error);
    return res.status(500).json({ error: 'Failed to send promotion' });
  }
};

exports.all = async (req, res) => {
  const { pageNo, perPage } = req.query;
  console.log('=======================', req.query);
  console.log(pageNo, perPage);
  
  try {
    const [rows] = await db.query(`SELECT * FROM promotions LIMIT ? OFFSET ?`, [Number(perPage), ((Number(pageNo) - 1) * Number(perPage))]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
