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
redis = new Redis(process.env.REDIS_URL);

}

module.exports = redis;
