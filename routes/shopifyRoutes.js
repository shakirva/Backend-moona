// routes/shopifyRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const SHOP = process.env.SHOPIFY_STORE;
const API_VER = process.env.SHOPIFY_API_VERSION;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const BASE = `https://${SHOP}/admin/api/${API_VER}`;

const headers = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
  'Content-Type': 'application/json'
};


function handleError(res, err, context) {
  console.error(`Error in Shopify ${context}:`, err.response?.data || err.message || err);
  res.status(500).json({ error: `Failed to fetch Shopify ${context}` });
}

router.get('/orders', async (req, res) => {
  try {
    const response = await axios.get(`${BASE}/orders.json`, { headers });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, 'orders list');
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE}/orders/${id}.json`, { headers });
    res.json(response.data);
  } catch (err) {
    handleError(res, err, `order detail for ID ${req.params.id}`);
  }
});

module.exports = router;
