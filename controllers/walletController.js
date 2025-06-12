const pool = require('../config/db');

// ➕ Credit coins using shopify_id
exports.creditCoins = async (req, res) => {
  const { shopify_id, order_id, amount } = req.body;

  if (!shopify_id || !order_id || !amount) {
    return res.status(400).json({ error: 'shopify_id, order_id, and amount are required' });
  }

  try {
    // 1. Get the user by Shopify ID
    const [userRows] = await pool.query('SELECT * FROM users WHERE shopify_id = ?', [shopify_id]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = user.id;

    // 2. Update the user coins
    const newBalance = user.coins + amount;
    await pool.query('UPDATE users SET coins = ? WHERE id = ?', [newBalance, user_id]);

    // 3. Insert transaction
    await pool.query(
      'INSERT INTO coin_transactions (user_id, shopify_id, order_id, type, coins, available_coins) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, shopify_id, order_id, 'credit', amount, newBalance]
    );

    res.json({
      success: true,
      message: `${amount} coins credited`,
      availableCoins: newBalance,
    });
  } catch (err) {
    console.error('creditCoins error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ➖ Apply coins using shopify_id
exports.applyCoins = async (req, res) => {
  const { shopify_id, order_id, coins_to_apply } = req.body;

  if (!shopify_id || !order_id || !coins_to_apply) {
    return res.status(400).json({ error: 'shopify_id, order_id, and coins_to_apply are required' });
  }

  try {
    const [[user]] = await pool.query('SELECT coins FROM users WHERE shopify_id = ?', [shopify_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.coins < coins_to_apply) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    const remainingCoins = user.coins - coins_to_apply;

    await pool.query('UPDATE users SET coins = ? WHERE shopify_id = ?', [remainingCoins, shopify_id]);

    await pool.query(
      'INSERT INTO coin_transactions (shopify_id, order_id, coins, type, available_coins) VALUES (?, ?, ?, ?, ?)',
      [shopify_id, order_id, coins_to_apply, 'debit', remainingCoins]
    );

    res.json({ success: true, message: 'Coins applied', availableCoins: remainingCoins });
  } catch (error) {
    console.error('Error applying coins:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 📜 Coin history
exports.getCoinHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ct.shopify_id,
        ct.order_id,
        ct.coins,
        ct.type,
        ct.available_coins,
        ct.created_at,
        u.name AS userName,
        u.email AS userEmail,
        u.mobile AS userMobile
      FROM coin_transactions ct
      JOIN users u ON ct.shopify_id = u.shopify_id
      ORDER BY ct.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching coin history:', error);
    res.status(500).json({ error: 'Error fetching coin history' });
  }
};

// 🔍 Check coins
exports.checkCoins = async (req, res) => {
  const { shopify_id } = req.query;

  if (!shopify_id) return res.status(400).json({ error: 'shopify_id is required' });

  try {
    const [[user]] = await pool.query('SELECT coins FROM users WHERE shopify_id = ?', [shopify_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.error('Error checking coins:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
