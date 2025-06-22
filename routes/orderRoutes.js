const express = require('express');
const router = express.Router();
const orderController = require('../controllers/razorpayController'); // Ensure this points to razorpayController.js
const authMiddleware = require('../middleware/authMiddleware');

// Razorpay payment creation (user buy)
router.post('/create-order', authMiddleware, orderController.createRazorpayOrder);

// Razorpay payment verification (client-side callback)
router.post('/verify', authMiddleware, orderController.verifyRazorpayPayment);

module.exports = router;