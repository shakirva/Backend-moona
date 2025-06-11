const pool = require('../config/db');

// ➕ Credit coins
exports.creditCoins = async (req, res) => {
  const { user_id, order_id, amount } = req.body;
  if (!user_id || !amount || !order_id) {
    return res.status(400).json({ error: 'user_id, order_id, and amount are required' });
  }

  const coins = Math.floor(amount / 10);

  try {
    const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedCoins = user.coins + coins;

    await pool.query('UPDATE users SET coins = ? WHERE id = ?', [updatedCoins, user_id]);

    await pool.query(
      'INSERT INTO coin_transactions (user_id, order_id, coins, type, available_coins) VALUES (?, ?, ?, ?, ?)',
      [user_id, order_id, coins, 'credit', updatedCoins]
    );

    res.json({ success: true, message: `${coins} coins credited`, availableCoins: updatedCoins });
  } catch (error) {
    console.error('Error crediting coins:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ➖ Apply coins
exports.applyCoins = async (req, res) => {
  const { user_id, order_id, coins_to_apply } = req.body;
  if (!user_id || !order_id || !coins_to_apply) {
    return res.status(400).json({ error: 'user_id, order_id, and coins_to_apply are required' });
  }

  try {
    const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.coins < coins_to_apply) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    const remainingCoins = user.coins - coins_to_apply;

    await pool.query('UPDATE users SET coins = ? WHERE id = ?', [remainingCoins, user_id]);

    await pool.query(
      'INSERT INTO coin_transactions (user_id, order_id, coins, type, available_coins) VALUES (?, ?, ?, ?, ?)',
      [user_id, order_id, coins_to_apply, 'debit', remainingCoins]
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
        ct.user_id,
        ct.order_id,
        ct.coins,
        ct.type,
        ct.available_coins,
        ct.created_at,
        u.name AS userName,
        u.email AS userEmail,
        u.mobile AS userMobile
      FROM coin_transactions ct
      JOIN users u ON ct.user_id = u.id
      ORDER BY ct.created_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching coin history:', error);
    res.status(500).json({ message: 'Error fetching coin history' });
  }
};

// 🔍 Check available coins
exports.checkCoins = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  try {
    const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.error('Error checking coins:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
