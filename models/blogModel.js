// models/blogModel.js
const pool = require('../config/db');

async function createBlog(data) {
  const res = await pool.query(
    'INSERT INTO blogs (data) VALUES ($1) RETURNING *',
    [data]
  );
  return res.rows[0];
}

async function getAllBlogs() {
  const res = await pool.query('SELECT * FROM blogs ORDER BY id');
  return res.rows;
}

async function updateBlog(id, data) {
  const res = await pool.query(
    'UPDATE blogs SET data = $1 WHERE id = $2 RETURNING *',
    [data, id]
  );
  return res.rows[0];
}

module.exports = { createBlog, getAllBlogs, updateBlog };