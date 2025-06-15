// userController.js
const model = require('../models/userModel');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    console.log("username, ", username, " and password, ", password, " and email, ", email)
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await model.createUser( username, email, hashedPassword );
    res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'User already exists' });
    }
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { username } = req.body;
  res.status(200).json({ message: `If ${username} exists, a reset link will be sent.` });
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await model.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await model.getUserById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await model.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const paramId = req.params.id;
    if (req.user.role !== 'admin' && req.user.sub !== paramId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await model.updateUser(paramId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await model.deleteUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
