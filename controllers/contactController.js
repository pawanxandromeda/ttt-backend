// controllers/contactController.js
const { createContact, getAllContacts, updateContact } = require('../models/contactModel');

exports.saveContact = async (req, res, next) => {
  try {
    const saved = await createContact(req.body);
    res.status(201).json(saved);
  } catch (err) { next(err); }
};

exports.getContacts = async (req, res, next) => {
  try {
    const list = await getAllContacts();
    res.json(list);
  } catch (err) { next(err); }
};

exports.updateContact = async (req, res, next) => {
  try {
    const updated = await updateContact(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err) { next(err); }
};