const db = require('../config/db');
const admin = require('../config/firebase');
const axios = require('axios');

// Shopify credentials
const { SHOPIFY_STORE, SHOPIFY_API_VERSION } = process.env;

const SHOPIFY_ADMIN_API = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`;

const shopifyHeaders = {
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json',
  }
};



exports.createOrderWebhook = async (req, res) => {
  try {
    console.log('=====================asdasdsadas==========================');
    const order = req.body;
    const shopifyId = order.customer?.id || null;
    const orderId = order.id;
    const totalPrice = parseFloat(order.total_price || 0);

    console.log(' Order Create ============== :', req.body);

    const [rules] = await db.query('SELECT * FROM points_rules WHERE min_amount <= ? AND max_amount >= ? LIMIT 1', [totalPrice, totalPrice]);
    console.log(' Coin Rule Found:', rules);
    if (rules.length === 0) {
      return res.status(200).send('No coin rule found');
    }

    const rule = rules[0];
    if (totalPrice < rule.min_amount || totalPrice > rule.max_amount) {
      return res.status(200).send('Order not eligible for coins');
    }

    const coins = Math.floor((totalPrice * rule.percentage) / 100);
    console.log(' Coins to be credited:', coins);

    let expiryDate = null;
    if (rule.points_valid_days > 0) {
      const now = new Date();
      now.setDate(now.getDate() + rule.points_valid_days);
      expiryDate = now.toISOString().split('T')[0];
    }

    const [lastData] = await db.query(
      `SELECT available_coins FROM coin_transactions WHERE shopify_id = ? ORDER BY created_at DESC LIMIT 1`,
      [shopifyId]
    );
    const totalCoins = (lastData[0]?.available_coins || 0) + coins;
    console.log(' Total Coins after crediting:', totalCoins, lastData);

    await db.query(
      `INSERT INTO coin_transactions 
        (shopify_id, order_id, coins, type, available_coins, expiry_date, created_at)
       VALUES (?, ?, ?, 'credited', ?, ?, NOW())`,
      [shopifyId, orderId, coins, totalCoins, expiryDate]
    );

    res.status(200).send(`Coins credited: ${coins}`);
  } catch (error) {
    console.error('❌ Error in createOrderWebhook:', error);
    res.status(500).send('Error processing order');
  }
};

exports.updateOrderWebhook = async (req, res) => {
  try {
    const order = req.body;
    const shopifyId = order.customer?.id;
    const orderNumber = order.name || order.id;

    console.log(' Order Update ============== :', order);

    const fulfillments = order.fulfillments || [];
    if (fulfillments.length > 0) {
      let shipmentStatus = fulfillments[0]?.shipment_status || order.fulfillment_status || 'updated';
      const statusMessages = {
        confirmed: 'Shipping info received',
        in_transit: 'Your order is on the way',
        out_for_delivery: 'Your order is almost there!',
        delivered: 'Your order has been delivered',
        failure: 'Delivery attempt failed. We’ll retry shortly.',
        unknown: 'We are checking your delivery status.',
        updated: 'Your order has been updated'
      };

      const messageBody = statusMessages[shipmentStatus] || 'Your order status was updated';
      const [users] = await db.query('SELECT device_id FROM users WHERE shopify_id = ?', [shopifyId]);
      const tokens = users.map(u => u.device_id).filter(token => token);

      if (tokens.length === 0) {
        console.log('No devices found for shopify_id:', shopifyId);
        return res.status(200).send('No devices to notify');
      }

      const message = {
        notification: {
          title: 'Order Update',
          body: `${messageBody} (Order #${orderNumber})`
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(' Push notification sent:', response);
    }

    res.status(200).send('Notification sent to devices');
  } catch (error) {
    console.error('Error in updateOrderWebhook:', error.message);
    res.status(500).send('Error sending notification');
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

// ✅ NEW: Get all Shopify orders with pagination
exports.getAllOrders = async (req, res) => {
  try {
    const { page_info, limit = 10 } = req.query;

    const url = new URL(`${SHOPIFY_ADMIN_API}/orders.json`);
    url.searchParams.append('limit', limit);
    url.searchParams.append('status', 'any');
    if (page_info) url.searchParams.append('page_info', page_info);

    const response = await axios.get(url.toString(), shopifyHeaders);

    res.set('Link', response.headers.link || '');
    res.json(response.data);
  } catch (error) {
    console.error('Shopify error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to fetch Shopify orders.',
      error: error.response?.data?.errors || error.message
    });
  }
};