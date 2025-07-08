const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Replace this with DB call in production
const ADMIN_EMAIL = 'admin@moona.com';
const ADMIN_HASHED_PASSWORD = '$2b$10$Ymr1Xz.L/chP75/CorXtA.FNuXmYYd.USsThehjIPog8.QFocITBW'; // from generatehash.js

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, ADMIN_HASHED_PASSWORD);

  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });

  return res.json({ message: 'Login successful', token });
});

module.exports = router;
