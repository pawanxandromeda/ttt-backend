/** @typedef {import('../types/types').Order} Order */
const { createRazorpayOrder } = require('../services/razorpayService');
const crypto = require('crypto');

const {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    updatePaymentStatus
  } = require('../models/orderModel');
  
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

  exports.createRazorpayOrder = async (req, res, next) => {
    try {
      const { package_id, amount } = req.body;
      const user_id = req.user.id;
      const receipt = `${user_id}_${package_id}_${Date.now()}`;
      const order = await createRazorpayOrder({
        amount: Math.round(Number(amount) * 100), // Convert to paise
        receipt,
      });
      res.json(order);
    } catch (err) {
      next(err);
    }
  };
  
  exports.verifyRazorpayPayment = async (req, res, next) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, package_id, amount } = req.body;
  
      // Verify signature
      const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest("hex");
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid signature." });
      }
  
      // Payment verified - Save order
      const order = await createOrder({
        user_id: req.user.id,
        package_id,
        payment_gateway: 'razorpay',
        payment_id: razorpay_payment_id,
        amount_paid: Number(amount),
        currency: 'INR',
        payment_status: 'paid'
      });
  
      res.status(201).json({ success: true, order });
    } catch (err) {
      next(err);
    }
  };
  