const db = require('../config/db');

exports.sendPromotion = async (req, res) => {
  const { title, body } = req.body;
  const image = req.file?.filename;

  if (!image || !title || !body) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${image}`;

  try {
    await db.query(
      'INSERT INTO promotions (image_url, title, body) VALUES (?, ?, ?)',
      [imageUrl, title, body]
    );

    return res.json({ success: true, message: 'Promotion stored in DB and sent to users' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
};
