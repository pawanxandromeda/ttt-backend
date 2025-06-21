// routes/calenderRoutes.js
const express = require('express');
const router = express.Router();
const { createCalendarEvent } = require('../controllers/calendarController');

router.post('/create-event', createCalendarEvent);

module.exports = router;
