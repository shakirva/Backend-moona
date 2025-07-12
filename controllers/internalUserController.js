const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ✅ Get all internal users
exports.getAllInternalUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, mobile, user_type, created_at FROM internal_users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error('Error fetching internal users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Create new internal user
exports.createInternalUser = async (req, res) => {
  const { name, email, password, mobile, user_type } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO internal_users (name, email, password, mobile, user_type) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, mobile, user_type]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Login internal user
exports.loginInternalUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM internal_users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET || 'your-secret-key', // Ideally from .env
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Update internal user
exports.updateInternalUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, mobile, user_type } = req.body;

  try {
    const updateFields = { name, email, mobile, user_type };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    const [result] = await pool.query('UPDATE internal_users SET ? WHERE id = ?', [
      updateFields,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Delete internal user
exports.deleteInternalUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM internal_users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
