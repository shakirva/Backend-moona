// 📁 controllers/dashboardController.js
const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [[userResult]] = await connection.query("SELECT COUNT(*) as count FROM users");
    const [[internalResult]] = await connection.query("SELECT COUNT(*) as count FROM internal_users");
    const [[couponResult]] = await connection.query("SELECT COUNT(*) as count FROM coupons");
    const [[orderResult]] = await connection.query("SELECT COUNT(*) as count FROM coin_transactions");

    connection.release();

    res.json({
      total_users: userResult.count,
      total_internal_users: internalResult.count,
      total_coupons: couponResult.count,
      total_orders: orderResult.count
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
