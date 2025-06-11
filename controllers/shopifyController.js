const pool = require('../config/db');

exports.handleOrderCreate = async (req, res) => {
  const { id: order_id, total_price, email } = req.body;

  try {
    // 1. Find the user by email
    const [[user]] = await pool.query('SELECT id, coins FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const user_id = user.id;
    const coins = Math.floor(total_price / 10);
    const updatedCoins = user.coins + coins;

    // 2. Update coins
    await pool.query('UPDATE users SET coins = ? WHERE id = ?', [updatedCoins, user_id]);

    // 3. Log transaction
    await pool.query(
      'INSERT INTO coin_transactions (user_id, order_id, coins, type, available_coins) VALUES (?, ?, ?, ?, ?)',
      [user_id, order_id, coins, 'credit', updatedCoins]
    );

    res.status(200).json({ success: true, message: `${coins} coins credited` });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
