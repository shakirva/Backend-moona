const db = require('../config/db');

exports.createOrderWebhook = async (req, res) => {
  try {
    console.log('=====================asdasdsadas==========================');
    const order = req.body;
    const shopifyId = order.customer?.id || null;
    const orderId = order.id;
    const totalPrice = parseFloat(order.total_price || 0);

    console.log(' Order Create ============== :',  req.body);

    // ✅ Get the latest rule
    const [rules] = await db.query('SELECT * FROM points_rules WHERE  min_amount <= '+totalPrice+' AND max_amount >= '+totalPrice+' LIMIT 1');
    console.log(' Coin Rule Found:', rules);
    if (rules.length === 0) {
      return res.status(200).send('No coin rule found');
    }
    const rule = rules[0] ? rules[0] : null;

    if(rule){
      if (totalPrice < rule.min_amount || totalPrice > rule.max_amount) {
            return res.status(200).send('Order not eligible for coins');
          }

          // ✅ Calculate coins using `percentage`
          const coins = Math.floor((totalPrice * rule.percentage) / 100);

          console.log(' Coins to be credited:', coins);
        
          // ✅ Set expiry date using `points_valid_days`
          let expiryDate = null;
          if (rule && rule.points_valid_days > 0) {
            const now = new Date();
            now.setDate(now.getDate() + rule.points_valid_days);
            expiryDate = now.toISOString().split('T')[0]; // format YYYY-MM-DD
          }
          
          console.log(' Coin Rule Found::::::::::::::::::::::::::::::');
          const [lastData] = await db.query(`SELECT available_coins FROM coin_transactions WHERE shopify_id =?  ORDER BY created_at DESC LIMIT 1 `, [shopifyId] );  
          const totalCoins = (lastData[0]?.available_coins || 0) + coins;

          console.log(' Total Coins after crediting:', totalCoins, lastData);


          // ✅ Insert transaction into `coin_transactions`
          await db.query(
            `INSERT INTO coin_transactions 
              (shopify_id, order_id, coins, type, available_coins, expiry_date, created_at)
            VALUES (?, ?, ?, 'credited', ?, ?, NOW())`,
            [shopifyId, orderId, coins, totalCoins, expiryDate]
          );

          res.status(200).send(`Coins credited: ${coins}`);
    }else{
      res.status(200).send(`Coins not credited: No rule found for this order`);
    }
    // ✅ Validate order amount
  } catch (error) {
    console.error('❌ Error in createOrderWebhook:', error);
    res.status(500).send('Error processing order');
  }
};

exports.updateOrderWebhook = async (req, res) => {
  try {
    const order = req.body;
    console.log(' Order Update Webhook Received:', order.id);
    res.status(200).send('Order update webhook received');
  } catch (error) {
    console.error(' Error in updateOrderWebhook:', error.message);
    res.status(500).send('Error');
  }
};

exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const [walletRows] = await db.query(
      'SELECT * FROM coin_transactions WHERE order_id = ? LIMIT 1',
      [orderId]
    );
    res.json({ wallet: walletRows[0] || null });
  } catch (error) {
    console.error(' Error in getOrderById:', error.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
