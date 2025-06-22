const { createRazorpayOrderDetails } = require('../services/razorpayService');
const crypto = require('crypto');

// CREATE a Razorpay order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    console.log("🔹 Incoming payload:", req.body);
    const { package_id, amount } = req.body;

    const user_id = req.user?.sub;
    console.log("🔹 User ID from token:", user_id);

    if (!user_id) return res.status(401).json({ error: 'Unauthorized: missing user_id' });
    if (!package_id || !amount) return res.status(400).json({ error: 'Missing package_id or amount' });

    const receipt = `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log("🔹 Generated receipt:", receipt);

    const razorpayOrder = await createRazorpayOrderDetails({
      amount: Math.round(Number(amount) * 100),
      receipt,
      currency: 'INR',
    });

    console.log("✅ Razorpay order created:", razorpayOrder);

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
    });
  } catch (err) {
    console.error("❌ Error in createRazorpayOrder:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

// VERIFY Razorpay payment
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification parameters." });
    }

    // Signature verification
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature." });
    }

    res.status(200).json({ 
      success: true,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id
    });
  } catch (err) {
    console.error("❌ Error in verifyRazorpayPayment:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};