const multer = require('multer');
const path = require('path');
const admin = require('../firebase/firebase-config');
const fs = require('fs');
const User = require('../models/User');

// Setup file upload
const upload = multer({ dest: 'uploads/' });

router.post('/send-promotion', upload.single('image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    const imagePath = req.file.path;

    const users = await User.findAll({ where: { mobile_device_id: { [Op.ne]: null } } });
    const tokens = users.map((u) => u.mobile_device_id).filter(Boolean);

    const imageBase64 = fs.readFileSync(imagePath, 'base64');
    const payload = {
      notification: {
        title,
        body,
        image: `data:image/png;base64,${imageBase64}`,
      },
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: payload.notification,
    });

    fs.unlinkSync(imagePath); // clean up
    return res.json({ message: `Promotion sent to ${response.successCount} users.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send promotion.' });
  }
});
