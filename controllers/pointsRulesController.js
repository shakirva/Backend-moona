const db = require('../config/db');

// ✅ Get All Rules (Admin)
exports.getAll = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM points_rules ORDER BY min_amount ASC');
  res.json(rows);
};

// ✅ Create Rule (Admin)
exports.create = async (req, res) => {
  const { min_amount, max_amount, percentage, points_valid_days, expiry_date } = req.body;
  await db.query(
    'INSERT INTO points_rules (min_amount, max_amount, percentage, points_valid_days, expiry_date) VALUES (?, ?, ?, ?, ?)',
    [min_amount, max_amount, percentage, points_valid_days, expiry_date]
  );
  res.json({ message: 'Rule added' });
};

// ✅ Update Rule (Admin)
exports.update = async (req, res) => {
  const { id } = req.params;
  const { min_amount, max_amount, percentage, points_valid_days, expiry_date } = req.body;
  await db.query(
    'UPDATE points_rules SET min_amount = ?, max_amount = ?, percentage = ?, points_valid_days = ?, expiry_date = ? WHERE id = ?',
    [min_amount, max_amount, percentage, points_valid_days, expiry_date, id]
  );
  res.json({ message: 'Rule updated' });
};

// ✅ Delete Rule (Admin)
exports.delete = async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM points_rules WHERE id = ?', [id]);
  res.json({ message: 'Rule deleted' });
};

// ✅ Credit + Debit Points Logic (Mobile API)
exports.creditPointsFlow = async (req, res) => {
  const { user_id, order_id, order_amount, used_points } = req.body;

  if (!user_id || !order_id || order_amount == null || used_points == null) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Step 1: Debit used points (if any)
    if (used_points > 0) {
      const [latest] = await db.query(
        'SELECT available_coins FROM coin_transactions WHERE shopify_id = ? ORDER BY id DESC LIMIT 1',
        [user_id]
      );
      const last_available = latest[0]?.available_coins || 0;
      const updated_available = last_available - used_points;

      await db.query(
        `INSERT INTO coin_transactions (shopify_id, order_id, coins, type, available_coins)
         VALUES (?, ?, ?, 'debited', ?)`,
        [user_id, order_id, used_points, updated_available]
      );
    }

    // Step 2: Fetch matching rule
    const [rules] = await db.query(
      'SELECT * FROM points_rules WHERE ? BETWEEN min_amount AND max_amount AND expiry_date >= CURRENT_DATE',
      [order_amount]
    );

    if (rules.length === 0) {
      return res.json({
        success: true,
        credited: 0,
        message: 'No rule matched. Only debit entry created.',
      });
    }

    const rule = rules[0];
    const credit_points = Math.floor((order_amount * rule.percentage) / 100);

    // Step 3: Get current coins
    const [latest2] = await db.query(
      'SELECT available_coins FROM coin_transactions WHERE shopify_id = ? ORDER BY id DESC LIMIT 1',
      [user_id]
    );
    const current_available = latest2[0]?.available_coins || 0;
    const updated_available2 = current_available + credit_points;

    // Step 4: Credit entry
    await db.query(
      `INSERT INTO coin_transactions (shopify_id, order_id, coins, type, available_coins)
       VALUES (?, ?, ?, 'credited', ?)`,
      [user_id, order_id, credit_points, updated_available2]
    );

    res.json({
      success: true,
      credited: credit_points,
      available_coins: updated_available2,
      message: 'Points credited & debited successfully.',
    });
  } catch (error) {
    console.error('Error in points workflow:', error);
    res.status(500).json({ message: 'Failed to process points.' });
  }
};

// ✅ User Coins History (Mobile API)
exports.getUserHistory = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, order_id, coins, type, available_coins, created_at FROM coin_transactions WHERE shopify_id = ? ORDER BY id DESC',
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};
