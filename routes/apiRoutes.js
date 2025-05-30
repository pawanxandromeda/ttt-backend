// routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

const contactCtrl = require('../controllers/contactController');
const blogCtrl = require('../controllers/blogController');
const newsletterCtrl = require('../controllers/newsletterController');
const eventCtrl = require('../controllers/eventController');

// Public contact
router.post('/contacts', contactCtrl.saveContact);``
router.get('/contacts', contactCtrl.getContacts);
router.put('/contacts/:id', contactCtrl.updateContact);

// Public newsletter
router.post('/newsletter', newsletterCtrl.subscribe);
router.get('/newsletter', newsletterCtrl.getSubscribers);
router.put('/newsletter/:id', newsletterCtrl.updateSubscription);

// Admin-only blog
router.post('/blogs', authMiddleware, checkRole('admin'), blogCtrl.saveBlog);
router.get('/blogs', blogCtrl.getBlogs);
router.put('/blogs/:id', authMiddleware, checkRole('admin'), blogCtrl.updateBlog);

// Admin-only events
router.post('/events', authMiddleware, checkRole('admin'), eventCtrl.saveEvent);
router.get('/events', eventCtrl.getEvents);
router.put('/events/:id', authMiddleware, checkRole('admin'), eventCtrl.updateEvent);

module.exports = router;