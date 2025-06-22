const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrderDetails({ amount, currency = 'INR', receipt }) {
  try {
    console.log("📦 Creating order with:", { amount, currency, receipt });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: 1,
    });
    return order;
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    throw err; // propagate to controller
  }
}


module.exports = { createRazorpayOrderDetails };
