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

// ✅ GET all users (from local DB)
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

// ✅ Sync Shopify customers to MySQL
exports.syncShopifyCustomers = async (req, res) => {
  try {
    const { data } = await axios.get(SHOPIFY_API_URL, shopifyHeaders);
    const customers = data.customers;

    for (const c of customers) {
      const address = c.default_address || {};
      const [existing] = await db.query('SELECT id FROM users WHERE shopify_id = ?', [c.id]);

      const userData = [
        c.id,
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

// ✅ Create User (Mobile)
exports.createUser = async (req, res) => {
  const { name, email, shopify_userid } = req.body;
  if (!name || !email || !shopify_userid) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    await db.query(
      'INSERT INTO users (name, email, shopify_id) VALUES (?, ?, ?)',
      [name, email, shopify_userid]
    );
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

// ✅ Save Delivery Address (Mobile)
exports.saveAddress = async (req, res) => {
  const {
    shopify_id,
    full_name,
    villa_building_number,
    zone,
    municipality,
    district,
    street,
    location_type,
    phone_number,
    preferred_delivery_timing,
    free_delivery_order_amount,
    delivery_fee,
    status
  } = req.body;

  try {
    if (!shopify_id || !full_name || !zone || !municipality || !district || !phone_number) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await db.query(
      `INSERT INTO user_addresses (
        shopify_id, full_name, villa_building_number, zone, municipality, district, street,
        location_type, phone_number, preferred_delivery_timing, free_delivery_order_amount,
        delivery_fee, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shopify_id,
        full_name,
        villa_building_number || '',
        zone,
        municipality,
        district,
        street || '',
        location_type || 'House',
        phone_number,
        preferred_delivery_timing || '',
        free_delivery_order_amount || 200,
        delivery_fee || 0,
        status || 1
      ]
    );

    res.json({ success: true, message: 'Address saved successfully' });

  } catch (error) {
    console.error('Error saving address:', error);
    res.status(500).json({ success: false, message: 'Failed to save address' });
  }
};

// ✅ Get All Addresses for Shopify User (Mobile)
exports.getAllAddresses = async (req, res) => {
  const { shopify_id } = req.query;
  if (!shopify_id) {
    return res.status(400).json({ message: 'Shopify ID required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM user_addresses WHERE shopify_id = ? ORDER BY created_at DESC',
      [shopify_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
};

// ✅ Placeholder: define if you're using this
exports.updateAddress = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};



// ✅ Shopify Webhook: Create User
exports.createUserWebhook = async (req, res) => {
  try {
    const c = req.body;
       console.log( "==============") ;

    console.log( c) ;
    const address = c.default_address || {};

    const [existing] = await db.query('SELECT id FROM users WHERE shopify_id = ?', [c.id]);

    const userData = [
      c.id,
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

    res.status(200).send('Customer create webhook handled');
  } catch (error) {
    console.error('❌ Error in createUserWebhook:', error.message);
    res.status(500).send('Error');
  }
};

// ✅ Shopify Webhook: Update User
exports.updateUserWebhook = exports.createUserWebhook; // Same logic for now
