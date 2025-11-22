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

// ✅ GET all users with pagination, search, and coin filter
exports.getUsers = async (req, res) => {
  const { search = '', filter = 'all', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Base query
    let baseQuery = `
      SELECT id, shopify_id, name, email, mobile, coins,
             shopify_total_spent, shopify_orders_count, shopify_created_at,
             address1, address2, city, province, zip, country
      FROM users
      WHERE 1
    `;
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1`;
    const values = [];
    const countValues = [];

    // Search filter (by name, email, or shopify_id)
    if (search) {
      baseQuery += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR shopify_id LIKE ?)`;
      countQuery += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR shopify_id LIKE ?)`;
      const searchVal = `%${search.toLowerCase()}%`;
      values.push(searchVal, searchVal, `%${search}%`);
      countValues.push(searchVal, searchVal, `%${search}%`);
    }

    // Coin filter
    if (filter === 'zero') {
      baseQuery += ` AND coins = 0`;
      countQuery += ` AND coins = 0`;
    } else if (filter === 'positive') {
      baseQuery += ` AND coins > 0`;
      countQuery += ` AND coins > 0`;
    }

    // Get total count
    const [countRows] = await db.query(countQuery, countValues);
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Add order, pagination
    baseQuery += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    values.push(Number(limit), Number(offset));

    // Get paginated users
    const [users] = await db.query(baseQuery, values);

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
      },
    });
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
  const { name, email, shopify_userid, device_id } = req.body;

  if (!name || !email || !shopify_userid || !device_id) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    await db.query(
      'INSERT INTO users (name, email, shopify_id, device_id) VALUES (?, ?, ?, ?)',
      [name, email, shopify_userid, device_id]
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
    status,
    latitude,
    longitude,
    full_address
  } = req.body;

  try {
    if (!shopify_id || !full_name || !zone || !municipality || !district || !phone_number) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse & validate coordinates if provided
    let lat = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null;
    let lon = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null;
    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ success: false, message: 'Invalid latitude value' });
    }
    if (lon !== null && (isNaN(lon) || lon < -180 || lon > 180)) {
      return res.status(400).json({ success: false, message: 'Invalid longitude value' });
    }

    const normalizedFullAddress = full_address || null; // allow null if not sent

    await db.query(
      `INSERT INTO user_addresses (
        shopify_id, full_name, villa_building_number, zone, municipality, district, street,
        location_type, phone_number, preferred_delivery_timing, free_delivery_order_amount,
        delivery_fee, status, latitude, longitude, full_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        status || 1,
        lat,
        lon,
        normalizedFullAddress
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

// ✅ Update Delivery Address (Mobile)
exports.updateAddress = async (req, res) => {
  const {
    address_id,
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
    status,
    latitude,
    longitude,
    full_address
  } = req.body;

  if (!address_id || !shopify_id || !full_name || !zone || !municipality || !district || !phone_number) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Parse & validate coordinates if provided
    let lat = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : null;
    let lon = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : null;
    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ success: false, message: 'Invalid latitude value' });
    }
    if (lon !== null && (isNaN(lon) || lon < -180 || lon > 180)) {
      return res.status(400).json({ success: false, message: 'Invalid longitude value' });
    }
    const normalizedFullAddress = full_address || null;

    const [result] = await db.query(
      `UPDATE user_addresses SET
        shopify_id = ?, full_name = ?, villa_building_number = ?, zone = ?, municipality = ?, district = ?,
        street = ?, location_type = ?, phone_number = ?, preferred_delivery_timing = ?, 
        free_delivery_order_amount = ?, delivery_fee = ?, status = ?, latitude = ?, longitude = ?, full_address = ?
      WHERE id = ?`,
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
        status || 1,
        lat,
        lon,
        normalizedFullAddress,
        address_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({ success: true, message: 'Address updated successfully' });
  } catch (error) {
    console.error('❌ Error updating address:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};


// ✅ Delete Delivery Address (Mobile)
exports.deleteAddress = async (req, res) => {
  const { address_id, shopify_id } = req.body;

  if (!address_id || !shopify_id) {
    return res.status(400).json({ success: false, message: 'Missing address_id or shopify_id' });
  }

  try {
    const [result] = await db.query(
      `DELETE FROM user_addresses WHERE id = ? AND shopify_id = ?`,
      [address_id, shopify_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found or already deleted' });
    }

    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
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


// ✅ GET user details by Shopify ID
exports.getUserDetails = async (req, res) => {
  const { shopify_id } = req.params;

  try {
    const [[user]] = await db.query(
      'SELECT * FROM users WHERE shopify_id = ?',
      [shopify_id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const customerUrl = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/customers/${shopify_id}.json`;

    console.log('🚀 Shopify URL:', customerUrl);

    const customerRes = await axios.get(customerUrl, {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    const ordersUrl = `https://${process.env.SHOPIFY_STORE}/admin/api/${process.env.SHOPIFY_API_VERSION}/orders.json?customer_id=${shopify_id}&status=any`;

    const ordersRes = await axios.get(ordersUrl, {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    return res.json({
      user: {
        ...user,
        ...customerRes.data.customer,
      },
      orders: ordersRes.data.orders,
    });
  } catch (error) {
    console.error('🔥 Shopify API error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch user details' });
  }
};



// ✅ Shopify Webhook: Update User
exports.updateUserWebhook = exports.createUserWebhook; // Same logic for now







exports.updateDeviceId = async (req, res) => {
  try {
    const { shopify_id, device_id } = req.body;
    if (!shopify_id || !device_id) {
      return res.status(400).json({ success: false, message: 'shopify_id and device_id required' });
    }

    await db.query('UPDATE users SET device_id = ? WHERE shopify_id = ?', [device_id, shopify_id]);

    res.json({ success: true, message: 'Device ID updated' });
  } catch (error) {
    console.error('Error in updateDeviceId:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};