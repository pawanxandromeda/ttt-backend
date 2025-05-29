// controllers/eventController.js
const { createEvent, getAllEvents, updateEvent } = require('../models/eventModel');

exports.saveEvent = async (req, res, next) => {
  try {
    const saved = await createEvent(req.body);
    res.status(201).json(saved);
  } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
  try {
    const list = await getAllEvents();
    res.json(list);
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const updated = await updateEvent(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err) { next(err); }
};