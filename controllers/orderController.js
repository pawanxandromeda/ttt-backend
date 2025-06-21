const { createRazorpayOrderDetails } = require('../services/razorpayService');
const crypto = require('crypto');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updatePaymentStatus,
} = require('../models/orderModel');

// Create Razorpay order and local DB order (status: pending)
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { package_id, amount, attendee_email, scheduled_date_time } = req.body;

    const user_id = req.user?.sub;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized: missing user_id' });
    if (!package_id || !amount) return res.status(400).json({ error: 'Missing package_id or amount' });

    const dbOrder = await createOrder({
      user_id,
      package_id,
      payment_gateway: 'razorpay',
      payment_id: null,
      amount_paid: amount,
      currency: 'INR',
      payment_status: 'pending',
    });

    const receipt = dbOrder.id;

    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrderDetails({
        amount: Math.round(Number(amount) * 100),
        receipt,
      });
    } catch (err) {
      console.error('Razorpay creation error:', err);
      return res.status(500).json({ error: 'Razorpay order creation failed' });
    }

    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      dbOrderId: dbOrder.id,
      amount,
      currency: 'INR',
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    next(err);
  }
};

// Verify Razorpay payment and update DB
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      db_order_id,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !db_order_id) {
      return res.status(400).json({ message: 'Missing payment verification parameters.' });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      await updatePaymentStatus(db_order_id, 'failed');
      return res.status(400).json({ message: 'Invalid signature.' });
    }

    await updateOrder(db_order_id, {
      payment_id: razorpay_payment_id,
      payment_status: 'paid',
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Payment verification error:', err);
    next(err);
  }
};

// Admin-only or fallback
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
