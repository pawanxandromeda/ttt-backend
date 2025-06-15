// config/db.js
const { Pool } = require('pg');
require('dotenv').config({path: '.env.local'});

// const isTest = process.env.NODE_ENV === 'test';
const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  // database: isTest
  //   ? process.env.TEST_DB_NAME
  //   : process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,
});

module.exports = pool;