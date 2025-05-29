const Redis = require('ioredis');

let redis;
if (process.env.NODE_ENV === 'test') {
  // In-memory mock for Jest
  const data = new Map();
  redis = {
    set:    (key, val, mode, ttl) => Promise.resolve(data.set(key, val)),
    get:    (key) => Promise.resolve(data.get(key)),
    exists: (key) => Promise.resolve(data.has(key) ? 1 : 0),
    del:    (key) => Promise.resolve(data.delete(key)),
    expire: (key, ttl) => Promise.resolve(),
  };
} else {
  // Real Redis client
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

module.exports = redis;
