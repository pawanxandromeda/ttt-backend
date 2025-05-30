// controllers/newsletterController.js

const {
  subscribeNewsletter,
  getAllSubscriptions,
  processUnsubscribeToken
} = require('../models/newsletterModel');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const unsubToken = require('crypto').randomUUID();
    const newSub = await subscribeNewsletter({ email, unsubscribe_token: unsubToken });

    res.status(201).json(newSub);
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ message: 'Email already subscribed' });
    } else {
      next(err);
    }
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const list = await getAllSubscriptions();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

exports.verifyOrUnsubscribe = async (req, res, next) => {
  try {
    const token = req.params.token;
    const result = await processUnsubscribeToken(token);

    if (!result) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    if (result.is_verified) {
      res.json({ message: 'Email verified successfully' });
    } else {
      res.json({ message: 'You have been unsubscribed from the newsletter' });
    }
  } catch (err) {
    next(err);
  }
};
