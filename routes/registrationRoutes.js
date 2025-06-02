// routes/registrationRoutes.js
const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole, isSelf } = require('../middleware/roleMiddleware');

/**
 * @route POST /registrations
 * @desc Create a new registration
 * @access Public (or authenticated)
 */
router.post('/', authMiddleware, checkRole('admin'), registrationController.createRegistration);

/**
 * @route GET /registrations
 * @desc Get registrations by arbitrary field (id, event_id, package_id, status, attendee_email, registration_token)
 * @access Public (or restricted by application logic)
 */
router.get('/', registrationController.getRegistrations);

/**
 * @route PUT /registrations/:id
 * @desc Update registration fields by ID (e.g., status, cancelled_at, order_id)
 * @access Admin (or authenticated with proper rights)
 */
router.put('/:id', authMiddleware, checkRole('admin'), registrationController.updateRegistration);

/**
 * @route POST /registrations/cancel/:token
 * @desc Cancel a registration using its registration_token
 * @access Public
 */
router.post('/cancel/:token', authMiddleware, isSelf('id'), registrationController.cancelRegistrationByToken);

/**
 * @route GET /registrations/user
 * @desc Get all registrations for the authenticated user
 * @access Authenticated
 */
router.get('/user', authMiddleware, isSelf('id'), registrationController.getRegistrationsByUser);

/**
 * @route POST /registrations/promote/:package_id
 * @desc Promote the next waitlisted registration (admin only)
 * @access Admin
 */
router.post(
  '/promote/:package_id',
  authMiddleware, checkRole('admin'), 
  registrationController.promoteNextInWaitlist
);

/**
 * @route GET /registrations/count
 * @desc Count how many are registered or waitlisted for a package
 * Query params: ?package_id=...&status=registered|waitlisted
 * @access Public (or admin)
 */
router.get('/count', registrationController.getCountByPackage);

module.exports = router;
