const db = require('../config/db');

// ✅ Get all Delivery Locations (Admin)
exports.getAllDeliveryLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM delivery_locations ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Failed to fetch locations.' });
  }
};

// ✅ Create or Update Delivery Location (Admin)
exports.createOrUpdateLocation = async (req, res) => {
  const { id, zone, municipality, district, delivery_fee, status } = req.body;

  if (!zone || !municipality || !district || delivery_fee == null || status == null) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    if (id) {
      await db.query(
        `UPDATE delivery_locations 
         SET zone = ?, municipality = ?, district = ?, delivery_fee = ?, status = ? 
         WHERE id = ?`,
        [zone, municipality, district, delivery_fee, status, id]
      );
    } else {
      await db.query(
        `INSERT INTO delivery_locations 
         (zone, municipality, district, delivery_fee, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [zone, municipality, district, delivery_fee, status]
      );
    }

    res.json({ message: 'Location saved successfully.' });
  } catch (err) {
    console.error('Error saving location:', err);
    res.status(500).json({ message: 'Failed to save location.' });
  }
};


// ✅ Mobile: Validate Delivery Location and Return Fee
exports.validateDeliveryLocation = async (req, res) => {
  const { zone, order_amount } = req.query;

  if (!zone || order_amount == null) {
    return res.status(400).json({ message: 'Missing zone or order amount.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT free_delivery_order_amount FROM delivery_locations 
       WHERE zone = ? AND status = 1 LIMIT 1`,
      [zone]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, delivery_fee: 0.00, msg: 'Invalid Location' });
    }

    const rule = rows[0];
    const threshold = parseFloat(rule.free_delivery_order_amount);
    const currentOrderAmount = parseFloat(order_amount);

    let delivery_fee = 0;

    if (currentOrderAmount >= threshold) {
      delivery_fee = 0;
    } else {
      delivery_fee = 20;
    }

    res.json({
      valid: true,
      delivery_fee,
      msg: 'Valid Location'
    });

  } catch (err) {
    console.error('Error validating delivery location:', err);
    res.status(500).json({ message: 'Validation failed.' });
  }
};


// ✅ Delete Delivery Location (Admin)
exports.deleteLocation = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Missing location ID.' });
  }

  try {
    const [result] = await db.query('DELETE FROM delivery_locations WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found or already deleted.' });
    }

    res.json({ message: 'Location deleted successfully.' });
  } catch (err) {
    console.error('Error deleting location:', err);
    res.status(500).json({ message: 'Failed to delete location.' });
  }
};
