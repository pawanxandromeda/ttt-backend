const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay Order
 * @param {number} amount - Amount in INR paise (e.g. 50000 = ₹500)
 * @param {string} currency - Default: INR
 * @param {string} receipt - Order ID or description
 */
function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
  return razorpay.orders.create({
    amount, // in paise
    currency,
    receipt,
    payment_capture: 1,
  });
}

module.exports = { createRazorpayOrder };
