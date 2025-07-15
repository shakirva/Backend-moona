const db = require('../config/db');

// ✅ Create or Update Coupon
exports.createOrUpdateCoupon = async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      min_order_value,
      max_order_value,
      offer_percentage,
      expiry_date,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO coupons (name, description, code, min_order_value, max_order_value, offer_percentage, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, code, min_order_value, max_order_value, offer_percentage, expiry_date]
    );

    console.log('Coupon saved:', result);
    res.json({ success: true, insertId: result.insertId });
  } catch (error) {
    console.error('Error inserting coupon:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ✅ Get All Coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const [coupons] = await db.query('SELECT * FROM coupons ORDER BY id DESC');
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ✅ Mobile: Get valid coupons for a user
exports.getUserCoupons = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [coupons] = await db.query(
      `SELECT * FROM coupons
       WHERE expiry_date >= CURDATE()
       ORDER BY expiry_date ASC`
    );
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error getting user coupons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
};
// ✅ Mobile: Apply Coupon
exports.applyCoupon = async (req, res) => {
  const { order_value, coupon_code } = req.body;

  if (!order_value || !coupon_code) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM coupons WHERE code = ? AND expiry_date >= CURDATE()`,
      [coupon_code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon.' });
    }

    const coupon = rows[0];

    if (order_value < coupon.min_order_value || order_value > coupon.max_order_value) {
      return res.status(400).json({ success: false, message: 'Order value not within coupon limits.' });
    }

    const coins = Math.floor((order_value * coupon.offer_percentage) / 100);
    res.json({ success: true, coins, coupon });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


// ✅ Mobile: Credit Coins after coupon applied successfully
exports.creditCouponCoins = async (req, res) => {
  const { user_id, coupon_code, order_id, coins } = req.body;

  if (!user_id || !coupon_code || !order_id || !coins) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    await db.query(
      `INSERT INTO coin_transactions (shopify_id, order_id, coins, type, available_coins)
       VALUES (?, ?, ?, 'credited', ?)`,
      [user_id, order_id, coins, coins]
    );

    res.json({ success: true, message: 'Coins credited successfully.' });
  } catch (error) {
    console.error('Error crediting coins:', error);
    res.status(500).json({ success: false, message: 'Failed to credit coins' });
  }
};



// ✅ Delete Coupon by ID
exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM coupons WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Coupon deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Coupon not found' });
    }
  } catch (err) {
    console.error('Delete coupon error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    code,
    min_order_value,
    max_order_value,
    offer_percentage,
    expiry_date,
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE coupons SET name=?, description=?, code=?, min_order_value=?, max_order_value=?, offer_percentage=?, expiry_date=? WHERE id=?`,
      [name, description, code, min_order_value, max_order_value, offer_percentage, expiry_date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};