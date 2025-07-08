// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const internalUserRoutes = require('./routes/internalUsers'); // handles /api/login
const adminRoutes = require('./routes/adminRoutes');
const pointsRulesRoutes = require('./routes/pointsRules');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const couponsRoutes = require('./routes/couponsRoutes');

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
app.use(bodyParser.json()); // Optional, express.json() is enough

// ✅ Static file serving (for image uploads etc.)
app.use('/uploads', express.static('uploads'));

// ✅ Mount all routes
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/points-rules', pointsRulesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/delivery-settings', deliveryRoutes);
app.use('/api/coupons', couponsRoutes);

// ✅ Admin login route (example: POST /api/login)
app.use('/api', internalUserRoutes);

// ✅ Root test route
app.get('/', (req, res) => {
  res.send('🚀 Moona API is running...');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
