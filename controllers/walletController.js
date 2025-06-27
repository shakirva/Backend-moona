// controllers/walletController.js
const db = require('../config/db');
const axios = require('axios');

const {
  SHOPIFY_STORE,
  SHOPIFY_API_KEY,
  SHOPIFY_API_PASSWORD,
  SHOPIFY_API_VERSION = '2023-07'
} = process.env;

const shopifyBase = `https://${SHOPIFY_API_KEY}:${SHOPIFY_API_PASSWORD}@${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

// Get coin transactions history (latest 200)
exports.getCoinHistory = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, shopify_id, order_id, coins, type, available_coins, created_at
      FROM coin_transactions
      ORDER BY created_at DESC
      LIMIT 200;
    `);
    res.json(rows);
  } catch (err) {
    console.error('getCoinHistory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Shopify order + wallet transaction details by order ID
exports.getOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Log received orderId
    console.log('Fetching details for Shopify Order ID:', orderId);

    // Fetch Shopify order
    const shopifyResp = await axios.get(`${shopifyBase}/orders/${orderId}.json`);
    const order = shopifyResp.data.order;

    // Log order success
    console.log('Shopify order fetched successfully:', order.name);

    // Fetch wallet transaction
    const [walletRows] = await db.query(
      `SELECT shopify_id, coins, type, available_coins, created_at
       FROM coin_transactions
       WHERE order_id = ?
       LIMIT 1`,
      [orderId]
    );

    console.log('Wallet transaction:', walletRows[0]);

    res.json({ order, wallet: walletRows[0] || null });

  } catch (err) {
    console.error('getOrderDetails error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};
