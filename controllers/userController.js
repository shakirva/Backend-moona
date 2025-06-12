const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/customers.json`;
const shopifyHeaders = {
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_API_PASSWORD,
    'Content-Type': 'application/json',
  },
};

// GET all users (from local DB)
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, shopify_id, name, email, mobile, coins,
             shopify_total_spent, shopify_orders_count, shopify_created_at,
             address1, address2, city, province, zip, country
      FROM users
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users with Shopify data:', error.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
};

// Sync Shopify customers to MySQL
exports.syncShopifyCustomers = async (req, res) => {
  try {
    const { data } = await axios.get(SHOPIFY_API_URL, shopifyHeaders);
    const customers = data.customers;

    for (const c of customers) {
      const address = c.default_address || {};
      const [existing] = await db.query('SELECT id FROM users WHERE shopify_id = ?', [c.id]);

      const userData = [
        c.id, // shopify_id
        (c.first_name || c.last_name) ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'N/A',
        c.email || 'N/A',
        c.phone || 'N/A',
        parseFloat(c.total_spent || 0),
        c.orders_count || 0,
        c.created_at ? new Date(c.created_at) : null,
        address.address1 || '',
        address.address2 || '',
        address.city || '',
        address.province || '',
        address.zip || '',
        address.country || '',
      ];

      if (existing.length > 0) {
        await db.query(
          `UPDATE users SET
            name = ?, email = ?, mobile = ?, shopify_total_spent = ?,
            shopify_orders_count = ?, shopify_created_at = ?, address1 = ?,
            address2 = ?, city = ?, province = ?, zip = ?, country = ?
           WHERE shopify_id = ?`,
          [...userData.slice(1), userData[0]]
        );
      } else {
        await db.query(
          `INSERT INTO users (
            shopify_id, name, email, mobile,
            shopify_total_spent, shopify_orders_count, shopify_created_at,
            address1, address2, city, province, zip, country
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          userData
        );
      }
    }

    res.json({ message: 'Shopify customers synced to local DB' });
  } catch (error) {
    console.error('Error syncing Shopify customers:', error.message);
    res.status(500).json({ error: 'Failed to sync Shopify customers' });
  }
};
