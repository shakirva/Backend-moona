// Load environment variables
require('dotenv').config();

// Initialize Firebase if you're using notifications
// require('./firebase/firebase-config');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes'); // 👈 includes /coin-history
const internalUserRoutes = require('./routes/internalUsers');
const shopifyWebhookRoutes = require('./routes/shopifyWebhookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pointsRulesRoutes = require('./routes/pointsRules');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const couponsRoutes = require('./routes/couponsRoutes'); // ✅ includes /api/coupons


const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Enable CORS for frontend (React running on port 3000)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Parse JSON request bodies
app.use(express.json());
app.use(bodyParser.json()); // Optional (use only one, express.json() is enough)

// ✅ Static file serving (for image uploads etc.)
app.use('/uploads', express.static('uploads'));

// ✅ Modular route mounting (do not change these names if used elsewhere)
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/internal-users', internalUserRoutes);
app.use('/api/wallet', walletRoutes); // ✅ confirms /api/wallet prefix
app.use('/api/points-rules', pointsRulesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/webhooks/shopify', shopifyWebhookRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/delivery-settings', deliveryRoutes);
app.use('/api/coupons', require('./routes/couponsRoutes'));



// ✅ Root test route
app.get('/', (req, res) => {
  res.send('🚀 Moona API is running...');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
