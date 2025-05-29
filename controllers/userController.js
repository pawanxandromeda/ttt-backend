// controllers/userController.js
const model = require('../models/userModel');
const bcrypt = require('bcrypt');
require('dotenv').config();

exports.register = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    // validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await model.createUser(username, password, role);
    res.status(201).json(user);
  } catch (err) {
    // Postgres unique‐violation code
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await model.getUserByUsername(username);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const jwt = require('jsonwebtoken');
    const { v4: uuid } = require('uuid');

    // sign access + refresh tokens
    const jti = uuid();
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, jti },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // store session
    const sessions = require('../services/sessionService');
    await sessions.createSession(refreshToken, { sub: user.id, role: user.role });

    // send back
    res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   true,
        sameSite: 'Strict',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, expiresIn: 900, jti });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { username } = req.body;
  // stub for later expansion
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
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await model.getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const paramId = Number(req.params.id);
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
    await model.deleteUser(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
