const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrderDetails({ amount, currency = 'INR', receipt }) {
  try {
    console.log('🔹 Creating Razorpay order with:', { amount, currency, receipt });

    // Validate parameters
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid or missing amount');
    }
    if (!receipt) {
      throw new Error('Missing receipt');
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Missing Razorpay environment variables');
    }

    const order = await razorpay.orders.create({
      amount, // in paise
      currency,
      receipt,
      payment_capture: 1,
    });

    console.log('✅ Razorpay order created:', order);
    return order;
  } catch (error) {
    console.error('❌ Razorpay order creation failed:', {
      message: error.message,
      stack: error.stack,
      error: error, // Log full error object
    });
    throw new Error(`Razorpay order creation failed: ${error.message || 'Unknown error'}`);
  }
}

module.exports = { createRazorpayOrderDetails };