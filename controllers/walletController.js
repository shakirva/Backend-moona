const db = require('../config/db'); // ✅ Required



// Apply Points (debit from wallet)
exports.applyPoints = async (req, res) => {
  const { shopify_id, order_id, coins } = req.body;

  if (!shopify_id || !order_id || !coins) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    // Get latest available coins
    const [latestRow] = await db.query(
      `SELECT available_coins FROM coin_transactions WHERE shopify_id = ? ORDER BY created_at DESC LIMIT 1`,
      [shopify_id]
    );

    const available = latestRow[0]?.available_coins || 0;

    if (coins > available) {
      return res.status(400).json({ message: 'Not enough available coins' });
    }

    const newBalance = available - coins;

    // Insert debit transaction
    await db.query(
      `INSERT INTO coin_transactions (shopify_id, order_id, coins, type, available_coins) VALUES (?, ?, ?, 'debited', ?)`,
      [shopify_id, order_id, coins, newBalance]
    );

    res.json({ success: true, message: 'Points applied successfully', newBalance });

  } catch (err) {
    console.error('applyPoints error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Available Points
exports.getAvailablePoints = async (req, res) => {
  const { shopify_id } = req.params;

  if (!shopify_id) {
    return res.status(400).json({ message: 'Missing shopify_id' });
  }

  try {
    const [rows] = await db.query(
      `SELECT available_coins FROM coin_transactions WHERE shopify_id = ? ORDER BY created_at DESC LIMIT 1`,
      [shopify_id]
    );

    const available = rows[0]?.available_coins || 0;
    res.json({ shopify_id, available_coins: available });

  } catch (err) {
    console.error('getAvailablePoints error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
