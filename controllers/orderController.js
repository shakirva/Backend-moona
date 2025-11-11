const db = require('../config/db');
// const admin = require('../config/firebase');
const axios = require('axios');
const { initializeFirebase } = require('../config/firebase'); // ✅ Make sure this import exists

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

<<<<<<< HEAD
=======


>>>>>>> dc3e34a (env set to all page)
exports.updateOrderWebhook = async (req, res) => {
  try {
    const order = req.body;
    const shopifyId = order.customer?.id?.toString();
    const orderNumber = order.name || order.id;

    console.log('✅ Order Webhook Triggered');
    console.log('🛍️ Shopify Customer ID:', shopifyId);
    console.log('🔢 Order Number:', orderNumber);

    const fulfillments = order.fulfillments || [];

    // Detect status from fulfillment or fallback to order
    let shipmentStatus = fulfillments[0]?.shipment_status || order.fulfillment_status || order.financial_status || 'updated';

    console.log('🚚 Shipment Status:', shipmentStatus);

    const statusMessages = {
      confirmed: 'Shipping info received',
      in_transit: 'Your order is on the way',
      out_for_delivery: 'Your order is almost there!',
      delivered: 'Your order has been delivered',
      failure: 'Delivery attempt failed. We’ll retry shortly.',
      voided: 'Your order has been canceled',
      refunded: 'Your order was refunded',
      unknown: 'We are checking your delivery status.',
      updated: 'Your order has been updated'
    };

    const messageBody = statusMessages[shipmentStatus] || 'Your order status was updated';

    const [users] = await db.query('SELECT device_id FROM users WHERE shopify_id = ?', [shopifyId]);
    console.log('📱 Matched Users:', users);

    const tokens = users.map(u => u.device_id).filter(Boolean);
    console.log('📲 Device Tokens:', tokens);

    if (tokens.length === 0) {
      console.warn('⚠️ No devices found for shopify_id:', shopifyId);
      return res.status(200).send('No devices to notify');
    }

    const admin = await initializeFirebase();

    const message = {
      tokens: tokens,
      notification: {
        title: 'Order Update',
        body: `${messageBody} (Order #${orderNumber})`
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log('✅ Push notification sent:', response);

    return res.status(200).json({
      message: 'Order update notification sent successfully',
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error) {
    console.error('❌ Error in updateOrderWebhook:', error.message);
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
    const { pageInfo, searchParams, limit = 10 } = req.query;
    console.log('Page Info:', searchParams);

    let url = new URL(`${SHOPIFY_ADMIN_API}/orders.json`);

    if (searchParams.order_id) {
      url = new URL(`${SHOPIFY_ADMIN_API}/orders/${searchParams.order_id}.json`);
    } else {
      if (pageInfo && pageInfo.current_type) {
        const link = pageInfo.current_type === 'next' ? pageInfo.next_link : pageInfo.prev_link;
        url = new URL(link);
      } else {
        url.searchParams.append('limit', limit);
        url.searchParams.append('status', 'any');
        Object.keys(searchParams || {}).forEach((key) => {
          if (searchParams[key]) url.searchParams.append(key, searchParams[key]);
        });
      }
    }

    console.log('Final URL:', url.toString());

    const response = await axios.get(url, shopifyHeaders);
    // console.log('Res ===== ', response);
    const orders = response.data.orders || [response.data.order];
    let o = { orders: orders || [], prev_link: '', next_link: '' };

    let urls = [];
    if (response.headers && response.headers.link) urls = response.headers.link.split(',');
    console.log('URLs from headers:', urls);

    urls.forEach((url) => {
      const splitted = url.split(';');
      const link = splitted[0].replace(/<|>/g, '').trim();
      const type = splitted[1].replace(/rel="|"$/g, '').trim();
      if (type === 'next') {
        o.next_link = link;
      } else if (type === 'previous') {
        o.prev_link = link;
      }
    });

    console.log('prev_link =================== :', o.prev_link);
    console.log('next_link =================== :', o.next_link);

    res.json(o);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch Shopify orders.',
      error: error.response?.data?.errors || error.message
    });
  }
};





exports.useCoinsForOrder = async (req, res) => {
  try {
    const { shopify_id, order_id, used_coins } = req.body;

    if (!shopify_id || !order_id || !used_coins) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get last available coins
    const [lastData] = await db.query(
      'SELECT available_coins FROM coin_transactions WHERE shopify_id = ? ORDER BY created_at DESC LIMIT 1',
      [shopify_id]
    );

    const currentCoins = lastData[0]?.available_coins || 0;

    if (used_coins > currentCoins) {
      return res.status(400).json({ message: 'Not enough coins to use' });
    }

    const updatedCoins = currentCoins - used_coins;

    // Save new debit transaction
    await db.query(
      `INSERT INTO coin_transactions 
        (shopify_id, order_id, coins, type, available_coins, created_at)
       VALUES (?, ?, ?, 'debited', ?, NOW())`,
      [shopify_id, order_id, used_coins, updatedCoins]
    );

    res.json({ message: `Coins debited successfully`, updated_coins: updatedCoins });
  } catch (error) {
    console.error('Error in useCoinsForOrder:', error.message);
    res.status(500).json({ message: 'Failed to debit coins', error: error.message });
  }
};
