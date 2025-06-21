const { createRazorpayOrderDetails } = require('../services/razorpayService');
const crypto = require('crypto');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updatePaymentStatus
} = require('../models/orderModel');

// CREATE a Razorpay order and a local DB order with status 'pending'
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    console.log("🔹 Incoming payload:", req.body);
    const { package_id, amount } = req.body;

    const user_id = req.user?.sub;
    console.log("🔹 User ID from token:", user_id);

    if (!user_id) return res.status(401).json({ error: 'Unauthorized: missing user_id' });
    if (!package_id || !amount) return res.status(400).json({ error: 'Missing package_id or amount' });

    // const dbOrder = await createOrder({
    //   user_id,
    //   package_id,
    //   payment_gateway: 'razorpay',
    //   payment_id: '',
    //   amount_paid: Number(amount),
    //   currency: 'INR',
    //   payment_status: 'pending',
    // });

    const receipt = dbOrder.id;
    console.log("🔹 Order saved to DB. Receipt:", receipt);

    const razorpayOrder = await createRazorpayOrderDetails({
      amount: Math.round(Number(amount) * 100),
      receipt,
    });

    console.log("✅ Razorpay order created:", razorpayOrder);

    res.json({
      razorpayOrderId: razorpayOrder.id,
      dbOrderId: dbOrder.id,
      amount: amount,
      currency: 'INR',
    });
  } catch (err) {
    console.error("❌ Error in createRazorpayOrder:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};

// VERIFY Razorpay payment and update DB order
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !db_order_id) {
      return res.status(400).json({ message: "Missing payment verification parameters." });
    }

    // Signature verification
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      await updatePaymentStatus(db_order_id, 'failed');
      return res.status(400).json({ message: "Invalid signature." });
    }

    // Mark order as paid and update payment ID
    await updateOrder(db_order_id, {
      payment_id: razorpay_payment_id,
      payment_status: 'paid'
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Create order manually (admin/other uses)
exports.saveOrder = async (req, res, next) => {
  try {
    const saved = await createOrder(req.body);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const updated = await updateOrder(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Missing status' });

    const updated = await updatePaymentStatus(req.params.id, status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
