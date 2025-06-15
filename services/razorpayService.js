const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrderDetails({ amount, currency = 'INR', receipt }) {
  console.log("Razor client: ", razorpay)
  return await razorpay.orders.create({
    amount, // in paise
    currency,
    receipt,
    payment_capture: 1,
  });
}

module.exports = { createRazorpayOrderDetails };
