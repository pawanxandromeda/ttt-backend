// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware')
const { checkRole, isSelfOrAdmin } = require('../middleware/roleMiddleware')

// Create a new order (public or authenticated)
router.post('/orders', authMiddleware, orderController.saveOrder);

// Get all orders (admin)
router.get('/orders', authMiddleware, checkRole('admin'), orderController.getOrders);

// Get single order by ID
router.get('/orders/:id', authMiddleware, isSelfOrAdmin('id'), orderController.getOrderById);

// Update an order (admin only)
router.put('/orders/:id', authMiddleware, checkRole('admin'), orderController.updateOrder);

// Update only the payment status (admin or webhook use)
router.patch('/orders/:id/status', authMiddleware, orderController.updatePaymentStatus);

module.exports = router;
