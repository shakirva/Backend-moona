// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const internalUserRoutes = require('./routes/internalUsers'); // ✅ Correct one
const adminRoutes = require('./routes/adminRoutes');
const pointsRulesRoutes = require('./routes/pointsRules');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const couponsRoutes = require('./routes/couponsRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const shopifyRoutes = require('./routes/shopifyRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Enable CORS for frontend (React running on port 3000)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Parse JSON request bodies
app.use(express.json());
app.use(bodyParser.json()); // Optional, can be removed since express.json() is enough

// ✅ Serve uploaded static files (like promotion images)
app.use('/uploads', express.static('uploads'));

// ✅ Mount all API routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/points-rules', pointsRulesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/delivery-settings', deliveryRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/promotion', promotionRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/internal-users', internalUserRoutes); // ✅ Only this for internal users


// ✅ Root test route
app.get('/', (req, res) => {
  res.send('🚀 Moona API is running...');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
