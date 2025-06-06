// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

/**
 * @route POST /events
 * @desc Create a new event (draft)
 * @access Admin only
 */
router.post(
  '/',
  authMiddleware,
  checkRole('admin'),
  eventController.createEvent
);

/**
 * @route GET /events
 * @desc 
 *   - Admin: GET /events?status=…  (requires valid JWT + role='admin')
 *   - Public: GET /events          (returns only published events)
 * @access Public (no token needed) OR Admin (with token and role)
 */
router.get('/', (req, res, next) => {
  // Try to parse a JWT if provided, but do not block if missing.
  // We need a small wrapper to call authMiddleware only if Authorization is present:
  const auth = req.header('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  // No token: proceed as public
  next();
}, eventController.getEventsByStatus);

/**
 * @route PUT /events/:id
 * @desc Update a single event
 * @access Admin only
 */
router.put(
  '/:id',
  authMiddleware,
  checkRole('admin'),
  eventController.updateEvent
);

/**
 * @route PUT /events/batch
 * @desc Batch update events (e.g. bulk publish/cancel)
 * @access Admin only
 */
router.put(
  '/batch',
  authMiddleware,
  checkRole('admin'),
  eventController.batchUpdateEvents
);

/**
 * @route PUT /events/:id/reactivate
 * @desc Reactivate a soft-deleted event
 * @access Admin only
 */
router.put(
  '/:id/reactivate',
  authMiddleware,
  checkRole('admin'),
  eventController.reactivateEvent
);

router.get('/search', (req, res, next) => {
  const auth = req.header('Authorization') || '';
  if (auth.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
}, eventController.getEventsByField); // <-- new controller here

module.exports = router;
