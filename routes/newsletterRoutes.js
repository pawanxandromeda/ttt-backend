// routes/newsletterRoutes.js

const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/authMiddleware')
const { checkRole, isSelf } = require('../middleware/roleMiddleware')

// Subscribe
router.post('/', newsletterController.subscribe);

// Get all subscriptions (admin)
router.get('/', authMiddleware, checkRole('admin'), newsletterController.getAll);

// Verify or unsubscribe with token
router.get('/verify/:token', isSelf('id'), newsletterController.verifyOrUnsubscribe);

module.exports = router;
