// services/razorpayService.js
const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️ Razorpay keys are not set in env. Check .env");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrderDetails({ amount, currency = 'INR', receipt }) {
  try {
    console.log("📦 Razorpay order create params:", { amount, currency, receipt });
    const order = await razorpay.orders.create({
      amount,          // in paise
      currency,
      receipt,
      payment_capture: 1, // auto-capture
    });
    console.log("✅ Razorpay order response:", order);
    return order;
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    throw err;
  }
}

module.exports = { createRazorpayOrderDetails };
