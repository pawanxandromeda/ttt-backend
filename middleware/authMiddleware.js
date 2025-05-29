// middleware/authMiddleware.js
const jwt   = require('jsonwebtoken');
const redis = require('../config/redis');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET in environment');

module.exports = async (req, res, next) => {
  const auth = req.header('Authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    console.log('[AUTH] No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = auth.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    console.log('[AUTH] Token verification failed:', e.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const { jti } = payload;
  if (jti) {
    const exists = await redis.exists(`bl:${jti}`);
    console.log(`[AUTH] checking blacklist jti=${jti} exists=${exists}`);
    if (exists) {
      console.log(`[AUTH] token jti=${jti} is revoked`);
      return res.status(401).json({ message: 'Token has been revoked' });
    }
  } else {
    console.log('[AUTH] no jti in token payload');
  }

  req.user = payload;
  next();
};
