const db = require('../config/db');
const admin = require('../config/firebase'); // Firebase Admin


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
    const shopifyId = order.customer?.id;
    const orderNumber = order.name || order.id;

    console.log(' Order Update ============== :', order);

    // Extract shipment status
    const fulfillments = order.fulfillments || [];

    if (fulfillments.length === 0) {
      console.log(' No fulfillments found for order:', orderNumber);
      return res.status(200).send('No fulfillments to process');
    
    let shipmentStatus = fulfillments[0]?.shipment_status || order.fulfillment_status || 'updated';

    
    
   
    const statusMessages = {
      confirmed: 'Shipping info received',
      in_transit: 'Your order is on the way',
      out_for_delivery: 'Your order is almost there!',
      delivered: 'Your order has been delivered ',
      failure: 'Delivery attempt failed. We’ll retry shortly.',
      unknown: 'We are checking your delivery status.',
      updated: 'Your order has been updated'
    };

    console.log(' Shipment Status:', shipmentStatus);

    const messageBody = statusMessages[shipmentStatus] || 'Your order status was updated';

   console.log(' Message Body:', messageBody);



    // 🔍 Get all devices for the user
    const [users] = await db.query('SELECT device_id FROM users WHERE shopify_id = ?', [shopifyId]);

    

    const tokens = users.map(u => u.device_id).filter(token => token); // only valid tokens

    if (tokens.length === 0) {
      console.log('No devices found for shopify_id:', shopifyId);
      return res.status(200).send('No devices to notify');
    }

    const message = {
      notification: {
        title: 'Order Update',
        body: `${messageBody} (Order #${orderNumber})`
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(' Push notification sent:', response);

  }


    res.status(200).send('Notification sent to devices');
  } catch (error) {
    console.error('Error in updateOrderWebhook:', error.message);
    res.status(500).send('Error sending notification');
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
