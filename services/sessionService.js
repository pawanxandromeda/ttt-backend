// services/sessionService.js
const redis = require('../config/redis');

const SESSION_PREFIX    = 'sess:';
const MAX_IDLE_SECONDS  = 24 * 60 * 60; // 1 day

async function createSession(refreshToken, payload) {
  const key = SESSION_PREFIX + refreshToken;
  await redis.set(key, JSON.stringify(payload), 'EX', MAX_IDLE_SECONDS);
}

async function verifyAndRenewSession(refreshToken) {
  const key  = SESSION_PREFIX + refreshToken;
  const data = await redis.get(key);
  if (!data) return null;
  await redis.expire(key, MAX_IDLE_SECONDS);
  return JSON.parse(data);
}

async function destroySession(refreshToken) {
  await redis.del(SESSION_PREFIX + refreshToken);
}

module.exports = {
  createSession,
  verifyAndRenewSession,
  destroySession
};
