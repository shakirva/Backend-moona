// controllers/shopifyController.js
const db = require('../db'); // Assuming you're using a db.js for MySQL

exports.getAllOrders = async (req, res) => {
  try {
    const response = await axios.get(`https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders.json`, {
      auth: {
        username: SHOPIFY_API_KEY,
        password: SHOPIFY_API_PASSWORD,
      },
    });

    let orders = response.data.orders;

    // Loop through orders and attach customer name from DB if missing
    for (let order of orders) {
      if (!order.customer || !order.customer.first_name) {
        const [rows] = await db.execute(
          `SELECT name FROM users WHERE shopify_id = ? LIMIT 1`,
          [order.customer?.id || order.customer_id || order.id]
        );
        if (rows.length) {
          const name = rows[0].name;
          order.customer = { first_name: name, last_name: '' }; // minimal structure
        }
      }
    }

    res.json({ orders });
  } catch (error) {
    console.error('Error in Shopify orders list:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch orders from Shopify' });
  }
};
