// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole, isSelfOrAdmin } = require('../middleware/roleMiddleware');

// Razorpay payment creation (user buy)
router.post('/create-order', authMiddleware, orderController.createRazorpayOrder);

// Razorpay payment verification (client-side callback)
router.post('/verify', authMiddleware, orderController.verifyRazorpayPayment);

// Get all orders (admin)
router.get('/', authMiddleware, checkRole('admin'), orderController.getOrders);

// Get single order by ID
router.get('/:id', authMiddleware, isSelfOrAdmin('id'), orderController.getOrderById);

// Update an order (admin only)
router.put('/:id', authMiddleware, checkRole('admin'), orderController.updateOrder);

// Update only the payment status (admin or webhook use)
router.patch('/:id/status', authMiddleware, orderController.updatePaymentStatus);

module.exports = router;
