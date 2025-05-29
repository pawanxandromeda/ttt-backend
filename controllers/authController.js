// controllers/authController.js
const jwt        = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const model      = require('../models/userModel');
const sessions   = require('../services/sessionService');
const redis      = require('../config/redis');
require('dotenv').config();

const JWT_SECRET     = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('Missing JWT_SECRET or REFRESH_SECRET in environment');
}

// ─── LOGIN ─────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await model.getUserByUsername(username);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await require('bcrypt').compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const jti = uuid();
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, jti },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, role: user.role },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await sessions.createSession(refreshToken, { sub: user.id, role: user.role });

    console.log(`[LOGIN] user=${user.username} jti=${jti}`);
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

// ─── REFRESH ────────────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).end();

    let payload;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch {
      return res.status(401).end();
    }

    const session = await sessions.verifyAndRenewSession(token);
    if (!session) return res.status(401).end();

    const jti = uuid();
    const accessToken = jwt.sign(
      { sub: session.sub, role: session.role, jti },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log(`[REFRESH] oldSession sub=${session.sub} new jti=${jti}`);
    res.json({ accessToken, expiresIn: 900, jti });
  } catch (err) {
    next(err);
  }
};

// ─── LOGOUT ─────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    // 1) destroy refresh-session & clear cookie
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      console.log(`[LOGOUT] destroying refresh session for token=${refreshToken.slice(0,10)}…`);
      await sessions.destroySession(refreshToken);
      res.clearCookie('refreshToken');
    } else {
      console.log('[LOGOUT] no refreshToken cookie present');
    }

    // 2) blacklist the access token JTI
    const auth = req.header('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      } catch (e) {
        console.log('[LOGOUT] could not decode access token:', e.message);
        return res.status(400).end();
      }
      const { jti, exp } = payload;
      console.log(`[LOGOUT] decoded access token jti=${jti}, exp=${exp}`);
      if (jti && exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;
        console.log(`[LOGOUT] blacklisting jti=${jti} for ttl=${ttl}s`);
        if (ttl > 0) {
          await redis.set(`bl:${jti}`, '1', 'EX', ttl);
        }
      }
    } else {
      console.log('[LOGOUT] no Authorization header');
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
