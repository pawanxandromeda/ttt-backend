// controllers/eventController.js
const eventModel = require('../models/eventModel');

/**
 * Create a new event (draft) – Admin only
 */
async function createEvent(req, res) {
  try {
    const {
      created_by,
      title,
      slug,
      description,
      location,
      start_time,
      end_time,
      registration_deadline,
      payment_required = false,
    } = req.body;
    const newEvent = await eventModel.createEvent({
      created_by,
      title,
      slug,
      description,
      location,
      start_time,
      end_time,
      registration_deadline,
      payment_required,
    });
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event.' });
  }
}

/**
 * Get events by status (admin) or only published (public/non-admin).
 */
async function getEventsByStatus(req, res) {
  try {
    if (req.user && req.user.role === 'admin') {
      // Admin path: expects ?status=…
      const { status } = req.query;
      if (!status) {
        return res
          .status(400)
          .json({ error: 'Query parameter "status" is required for admins.' });
      }
      const events = await eventModel.getEventsByStatus(status);
      return res.json(events);
    } else {
      // Public/non-admin: show only published
      const events = await eventModel.getPublishedEvents();
      return res.json(events);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
}

/**
 * Update a single event – Admin only
 */
async function updateEvent(req, res) {
  try {
    const id = req.params.id;
    const updatedEvent = await eventModel.updateEvent(id, req.body);
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json(updatedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event.' });
  }
}

/**
 * Batch update events – Admin only
 */
async function batchUpdateEvents(req, res) {
  try {
    const { ids, ...fieldsToUpdate } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required.' });
    }
    await eventModel.batchUpdateEvents(ids, fieldsToUpdate);
    res.json({ message: 'Events updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to batch update events.' });
  }
}

/**
 * Reactivate a soft-deleted event – Admin only
 */
async function reactivateEvent(req, res) {
  try {
    const { id } = req.params;
    const reactivated = await eventModel.reactivateEvent(id);
    if (!reactivated) {
      return res
        .status(400)
        .json({ error: 'Event not found or not soft-deleted.' });
    }
    res.json(reactivated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reactivate event.' });
  }
}

module.exports = {
  createEvent,
  getEventsByStatus,
  updateEvent,
  batchUpdateEvents,
  reactivateEvent,
};
