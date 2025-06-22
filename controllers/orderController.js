// controllers/orderController.js
const { createRazorpayOrderDetails } = require('../services/razorpayService');
const crypto = require('crypto');
// Assume you have some DB utilities:
const PackageModel = require('../models/Package');       // to fetch package by ID
const OrderModel = require('../models/Order');           // to create/update order records

// CREATE a Razorpay order
exports.createRazorpayOrder = async (req, res) => {
  try {
    console.log("🔹 Incoming payload:", req.body);
    const { package_id } = req.body;

    const user_id = req.user?.sub;
    console.log("🔹 User ID from token:", user_id);
    if (!user_id) {
      return res.status(401).json({ error: 'Unauthorized: missing user_id' });
    }
    if (!package_id) {
      return res.status(400).json({ error: 'Missing package_id' });
    }

    // 1. Fetch package from DB and validate it exists
    const pkg = await PackageModel.findById(package_id);
    if (!pkg) {
      return res.status(404).json({ error: 'Invalid package_id' });
    }
    // Assume pkg.price is in rupees, e.g., 1200
    const expectedAmountRupees = pkg.price;
    if (typeof expectedAmountRupees !== 'number' || expectedAmountRupees <= 0) {
      return res.status(500).json({ error: 'Invalid package configuration' });
    }

    // 2. Generate a unique receipt
    const receipt = `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log("🔹 Generated receipt:", receipt);

    // 3. Create a local order record with status 'pending' (before calling Razorpay)
    //    Store user_id, package_id, receipt, amount in paise or rupees as you prefer
    const localOrder = await OrderModel.create({
      userId: user_id,
      packageId: package_id,
      receipt,
      amountRupees: expectedAmountRupees,
      status: 'pending',
      // razorpayOrderId to be added after razorpay call
    });

    // 4. Create Razorpay order
    const amountPaise = Math.round(expectedAmountRupees * 100);
    console.log("📦 Creating Razorpay order with amount (paise):", amountPaise);
    const razorpayOrder = await createRazorpayOrderDetails({
      amount: amountPaise,
      currency: 'INR',
      receipt,
    });
    console.log("✅ Razorpay order created:", razorpayOrder);

    // 5. Update local order with razorpayOrderId
    localOrder.razorpayOrderId = razorpayOrder.id;
    await localOrder.save();

    // 6. Return to client
    return res.json({
      orderId: razorpayOrder.id,
      amount: expectedAmountRupees,
      currency: 'INR',
    });
  } catch (err) {
    console.error("❌ Error in createRazorpayOrder:", {
      message: err.message,
      stack: err.stack,
      error: err,
    });
    // If Razorpay error has extra description:
    let details = err.message;
    if (err.error && err.error.description) {
      details = err.error.description;
    }
    return res.status(500).json({
      error: "Internal Server Error",
      details,
    });
  }
};

// VERIFY Razorpay payment
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification parameters." });
    }

    // 1. Verify signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");
    if (generated_signature !== razorpay_signature) {
      console.warn("Invalid Razorpay signature:", { razorpay_order_id, razorpay_payment_id });
      return res.status(400).json({ message: "Invalid signature." });
    }

    // 2. Find local order by razorpayOrderId
    const localOrder = await OrderModel.findOne({ razorpayOrderId: razorpay_order_id });
    if (!localOrder) {
      // Possibly log for manual investigation
      return res.status(404).json({ error: 'Order not found' });
    }

    if (localOrder.status === 'paid') {
      // Already handled
      return res.status(200).json({ success: true, message: 'Already verified' });
    }

    // 3. Update local order status to 'paid'
    localOrder.status = 'paid';
    localOrder.razorpayPaymentId = razorpay_payment_id;
    localOrder.paidAt = new Date();
    await localOrder.save();

    // 4. (Optional) trigger post-payment actions, e.g., send confirmation email, calendar event, etc.

    return res.status(200).json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err) {
    console.error("❌ Error in verifyRazorpayPayment:", {
      message: err.message,
      stack: err.stack,
      error: err,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message || 'Unknown error occurred',
    });
  }
};
