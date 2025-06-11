const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

const SHOPIFY_API_URL = `${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/customers.json`;

const shopifyHeaders = {
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_API_PASSWORD,
    'Content-Type': 'application/json',
  },
};

// ✅ Get users (Local DB + Shopify + Shopify Address)
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, mobile, device_id, coins FROM users');

    const shopifyResponse = await axios.get(SHOPIFY_API_URL, shopifyHeaders);
    const shopifyCustomers = shopifyResponse.data.customers;

    const mergedUsers = users.map(user => {
      const shopifyData = shopifyCustomers.find(c => c.email === user.email) || {};
      const address = shopifyData.default_address || {};

      return {
        ...user,
        shopify_id: shopifyData.id || null,
        shopify_total_spent: shopifyData.total_spent || '0.00',
        shopify_orders_count: shopifyData.orders_count || 0,
        shopify_created_at: shopifyData.created_at || null,
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        province: address.province || '',
        zip: address.zip || '',
        country: address.country || '',
      };
    });

    res.json(mergedUsers);
  } catch (error) {
    console.error('Error fetching users with Shopify data:', error.message);
    res.status(500).json({ error: 'Failed to fetch users with Shopify data' });
  }
};

// ✅ Create or update user manually
exports.saveUser = async (req, res) => {
  const { id, name, email, mobile, device_id } = req.body;

  try {
    if (id) {
      await db.query(
        'UPDATE users SET name = ?, email = ?, mobile = ?, device_id = ? WHERE id = ?',
        [name, email, mobile, device_id, id]
      );
      res.json({ message: 'User updated successfully' });
    } else {
      await db.query(
        'INSERT INTO users (name, email, mobile, device_id, coins) VALUES (?, ?, ?, ?, ?)',
        [name, email, mobile, device_id, 0]
      );
      res.json({ message: 'User created successfully' });
    }
  } catch (err) {
    console.error('Error saving user:', err.message);
    res.status(500).json({ error: 'Failed to save user' });
  }
};

// ✅ Sync Shopify customers to local MySQL
exports.syncShopifyCustomers = async (req, res) => {
  try {
    const shopifyResponse = await axios.get(SHOPIFY_API_URL, shopifyHeaders);
    const customers = shopifyResponse.data.customers;

    for (const customer of customers) {
      const email = customer.email;
      const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      const mobile = customer.phone || '';
      const device_id = ''; // optional

      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

      if (existing.length > 0) {
        await db.query(
          'UPDATE users SET name = ?, mobile = ?, device_id = ? WHERE email = ?',
          [name, mobile, device_id, email]
        );
      } else {
        await db.query(
          'INSERT INTO users (name, email, mobile, device_id, coins) VALUES (?, ?, ?, ?, ?)',
          [name, email, mobile, device_id, 0]
        );
      }
    }

    res.json({ message: 'Shopify customers synced to MySQL successfully' });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync customers from Shopify' });
  }
};
