const db = require('../config/db');

// GET General Settings
exports.getGeneralSettings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM general_settings LIMIT 1');
    res.json(rows[0] || {});
  } catch (err) {
    console.error('getGeneralSettings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST or UPDATE General Settings
exports.saveGeneralSettings = async (req, res) => {
  const { min_order_value, support_contact } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM general_settings LIMIT 1');

    if (existing.length) {
      await db.query('UPDATE general_settings SET min_order_value = ?, support_contact = ?', [
        min_order_value, support_contact
      ]);
    } else {
      await db.query('INSERT INTO general_settings (min_order_value, support_contact) VALUES (?, ?)', [
        min_order_value, support_contact
      ]);
    }

    res.json({ message: 'Settings saved' });
  } catch (err) {
    console.error('saveGeneralSettings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
