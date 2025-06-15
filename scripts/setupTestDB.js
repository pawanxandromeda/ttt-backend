#!/usr/bin/env node
// scripts/setupTestDB.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

(async () => {
  const adminPool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT,
  });

  const testDbName = process.env.TEST_DB_NAME;
  try {
    console.log(`Creating test database '${testDbName}'...`);
    await adminPool.query(`CREATE DATABASE ${testDbName}`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log(`Database '${testDbName}' already exists, skipping creation.`);
    } else {
      console.error('Error creating test database:', err.message);
      process.exit(1);
    }
  }

  const testPool = new Pool({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    database: testDbName,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT,
  });

  try {
    console.log(`Creating 'users' table in '${testDbName}'...`);
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(200) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user'
      );
    `);
    console.log('Setup complete.');
  } catch (err) {
    console.error('Error creating table in test DB:', err.message);
    process.exit(1);
  } finally {
    await adminPool.end();
    await testPool.end();
  }
})();
