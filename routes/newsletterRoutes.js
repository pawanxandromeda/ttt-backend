// routes/newsletterRoutes.js

const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/authMiddleware')
const { checkRole, isSelf } = require('../middleware/roleMiddleware')

// Subscribe
router.post('/newsletter', newsletterController.subscribe);

// Get all subscriptions (admin)
router.get('/newsletter', authMiddleware, checkRole('admin'), newsletterController.getAll);

// Verify or unsubscribe with token
router.get('/newsletter/verify/:token', isSelf('id'), newsletterController.verifyOrUnsubscribe);

module.exports = router;
