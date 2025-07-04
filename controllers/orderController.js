// controllers/orderController.js
const db = require('../config/db');

exports.createOrderWebhook = async (req, res) => {
  try {
    const order = req.body;

    console.log('🛒 Order Create Webhook Received:', order.id);

    // You can log/store the order here
    await db.query(
      `INSERT INTO coin_transactions (shopify_id, order_id, coins, type, available_coins, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        order.customer?.id || null,
        order.id,
        0, // Or actual logic for coins
        'credited',
        0,
      ]
    );

    res.status(200).send('Order create webhook received');
  } catch (error) {
    console.error('❌ Error handling order create webhook:', error.message);
    res.status(500).send('Error');
  }
};

exports.updateOrderWebhook = async (req, res) => {
  try {
    const order = req.body;

    console.log('🛒 Order Update Webhook Received:', order.id);

    // Update logic if needed
    res.status(200).send('Order update webhook received');
  } catch (error) {
    console.error('❌ Error handling order update webhook:', error.message);
    res.status(500).send('Error');
  }
};



// Inside orderController.js
exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const [walletRows] = await db.query(
      'SELECT * FROM coin_transactions WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    res.json({ wallet: walletRows[0] || null });
  } catch (error) {
    console.error('❌ Error fetching order:', error.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
