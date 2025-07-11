const axios = require('axios');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=${limit}&status=any`;

    if (search) {
      url += `&name=${encodeURIComponent(search)}`;
    }

    if (status) {
      url += `&financial_status=${encodeURIComponent(status)}`;
    }

    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const allOrders = response.data.orders || [];
    const paginatedOrders = allOrders.slice(offset, offset + limit);

    const totalOrders = allOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      currentPage: parseInt(page),
      totalPages,
      totalOrders,
      orders: paginatedOrders,
    });
  } catch (error) {
    console.error('Shopify fetch error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch orders from Shopify' });
  }
};

module.exports = {
  getAllOrders,
};
