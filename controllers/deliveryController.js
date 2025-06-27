const db = require('../config/db');

exports.getAllDeliveryLocations = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM delivery_locations ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Failed to fetch locations.' });
  }
};

exports.createOrUpdateLocation = async (req, res) => {
  const {
    id,
    zone_number,
    municipality,
    district,
    delivery_fee,
    free_delivery_order_amount,
    status
  } = req.body;

  if (
    !zone_number || !municipality || !district ||
    delivery_fee == null || free_delivery_order_amount == null || status == null
  ) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    if (id) {
      // Update
      await db.query(
        `UPDATE delivery_locations 
         SET zone_number = ?, municipality = ?, district = ?, delivery_fee = ?, free_delivery_order_amount = ?, status = ? 
         WHERE id = ?`,
        [zone_number, municipality, district, delivery_fee, free_delivery_order_amount, status, id]
      );
    } else {
      // Insert
      await db.query(
        `INSERT INTO delivery_locations 
         (zone_number, municipality, district, delivery_fee, free_delivery_order_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [zone_number, municipality, district, delivery_fee, free_delivery_order_amount, status]
      );
    }

    res.json({ message: 'Location saved successfully.' });
  } catch (err) {
    console.error('Error saving location:', err);
    res.status(500).json({ message: 'Failed to save location.' });
  }
};

exports.validateDeliveryLocation = async (req, res) => {
  const { zone_number, municipality, district } = req.body;

  if (!zone_number || !municipality || !district) {
    return res.status(400).json({ message: 'Missing location details.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT delivery_fee, free_delivery_order_amount FROM delivery_locations 
       WHERE zone_number = ? AND municipality = ? AND district = ? AND status = 1`,
      [zone_number, municipality, district]
    );

    if (rows.length > 0) {
      res.json({
        valid: true,
        delivery_fee: rows[0].delivery_fee,
        free_delivery_order_amount: rows[0].free_delivery_order_amount
      });
    } else {
      res.json({ valid: false, message: 'Invalid delivery location.' });
    }
  } catch (err) {
    console.error('Error validating delivery location:', err);
    res.status(500).json({ message: 'Validation failed.' });
  }
};
