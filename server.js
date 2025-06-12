require('dotenv').config();
require('./firebase/firebase-config');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const internalUserRoutes = require('./routes/internalUsers');
const shopifyWebhookRoutes = require('./routes/shopifyWebhookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(bodyParser.json());

app.use('/webhooks/shopify', shopifyWebhookRoutes);
app.use('/api/internal-users', internalUserRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Moona API is running...');
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
