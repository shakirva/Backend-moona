const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/db'); // ✅ Corrected path

require('dotenv').config();

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}`;
const shopifyHeaders = {
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_API_PASSWORD,
    'Content-Type': 'application/json',
  },
};

// GET /api/orders/:orderId
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    // Fetch order from Shopify
    const shopifyRes = await axios.get(
      `${SHOPIFY_API_URL}/orders/${orderId}.json`,
      shopifyHeaders
    );

    const order = shopifyRes.data.order;

    // Get wallet transaction from DB using order_id
    const [walletRows] = await pool.query(
      'SELECT * FROM coin_transactions WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    const wallet = walletRows.length > 0 ? walletRows[0] : null;

    res.json({ customer: order.customer, wallet });
  } catch (error) {
    console.error('Error fetching order or wallet data:', error.message);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

module.exports = router;
