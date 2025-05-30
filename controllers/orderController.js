/** @typedef {import('../types/types').Order} Order */

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
  