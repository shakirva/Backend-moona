const db = require('../config/db');

exports.createOrderWebhook = async (req, res) => {
  try {
    const order = req.body;
    const shopifyId = order.customer?.id || null;
    const orderId = order.id;
    const totalPrice = parseFloat(order.total_price || 0);

    console.log(' Order Create Webhook Received:', orderId);

    // ✅ Get the latest rule
    const [rules] = await db.query('SELECT * FROM points_rules ORDER BY id DESC LIMIT 1');
    if (!rules.length) {
      return res.status(200).send('No coin rule found');
    }

    const rule = rules[0];

    // ✅ Validate order amount
    if (totalPrice < rule.min_amount || totalPrice > rule.max_amount) {
      return res.status(200).send('Order not eligible for coins');
    }

    // ✅ Calculate coins using `percentage`
    const coins = Math.floor((totalPrice * rule.percentage) / 100);

    // ✅ Set expiry date using `points_valid_days`
    let expiryDate = null;
    if (rule.points_valid_days > 0) {
      const now = new Date();
      now.setDate(now.getDate() + rule.points_valid_days);
      expiryDate = now.toISOString().split('T')[0]; // format YYYY-MM-DD
    }

    // ✅ Insert transaction into `coin_transactions`
    await db.query(
      `INSERT INTO coin_transactions 
        (shopify_id, order_id, coins, type, available_coins, expiry_date, created_at)
       VALUES (?, ?, ?, 'credited', ?, ?, NOW())`,
      [shopifyId, orderId, coins, coins, expiryDate]
    );

    res.status(200).send(`Coins credited: ${coins}`);
  } catch (error) {
    console.error('❌ Error in createOrderWebhook:', error.message);
    res.status(500).send('Error processing order');
  }
};

exports.updateOrderWebhook = async (req, res) => {
  try {
    const order = req.body;
    console.log(' Order Update Webhook Received:', order.id);
    res.status(200).send('Order update webhook received');
  } catch (error) {
    console.error(' Error in updateOrderWebhook:', error.message);
    res.status(500).send('Error');
  }
};

exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const [walletRows] = await db.query(
      'SELECT * FROM coin_transactions WHERE order_id = ? LIMIT 1',
      [orderId]
    );
    res.json({ wallet: walletRows[0] || null });
  } catch (error) {
    console.error(' Error in getOrderById:', error.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
