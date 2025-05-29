// controllers/newsletterController.js
const { subscribeNewsletter, getAllSubscriptions, updateSubscription } = require('../models/newsletterModel');

exports.subscribe = async (req, res, next) => {
  try {
    const saved = await subscribeNewsletter(req.body);
    res.status(201).json(saved);
  } catch (err) { next(err); }
};

exports.getSubscribers = async (req, res, next) => {
  try {
    const list = await getAllSubscriptions();
    res.json(list);
  } catch (err) { next(err); }
};

exports.updateSubscription = async (req, res, next) => {
  try {
    const updated = await updateSubscription(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err) { next(err); }
};