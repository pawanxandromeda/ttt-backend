/** @typedef {import('../types/types').Blog} Blog */

// models/blogModel.js
const pool = require('../config/db');

/**
 * @param {Blog} data
 * @returns {Promise<Blog>}
 */
async function createBlog(data) {
  const {
    author_id,
    title = null,
    slug = null,
    summary = null,
    content = null,
    media_cid = null,
  } = data;
  const res = await pool.query(
    `
    INSERT INTO blogs (author_id, title, slug, summary, content, media_cid)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `,
    [author_id, title, slug, summary, content, media_cid]
  );
  return res.rows[0];
}

/**
 * Fetch all blogs (no status filter).
 * For admin screens only.
 * @returns {Promise<Blog[]>}
 */
async function getAllBlogs() {
  const res = await pool.query(
    `
    SELECT * FROM blogs
    ORDER BY created_at DESC;
  `
  );
  return res.rows;
}

/**
 * Fetch a single blog by ID.
 * If admin=false, only returns when status='published' AND deleted_at IS NULL.
 * If admin=true, returns regardless of status/deleted_at.
 *
 * @param {string} id
 * @param {Object} [opts]
 * @param {boolean} [opts.admin]
 * @returns {Promise<Blog|null>}
 */
async function getBlogById(id, { admin = false } = {}) {
  if (admin) {
    const res = await pool.query(
      `
      SELECT * FROM blogs
       WHERE id = $1;
    `,
      [id]
    );
    return res.rows[0] || null;
  } else {
    const res = await pool.query(
      `
      SELECT * FROM blogs
       WHERE id = $1
         AND status = 'published'
         AND deleted_at IS NULL;
    `,
      [id]
    );
    return res.rows[0] || null;
  }
}

/**
 * Fetch blogs by any field (e.g., slug or author_id).
 * If admin=false, applies "status='published' AND deleted_at IS NULL" filter.
 * @param {string} field  - Column name to filter by (must be validated upstream).
 * @param {any} value
 * @param {Object} [opts]
 * @param {boolean} [opts.admin]
 * @returns {Promise<Blog[]>}
 */
async function getBlogByField(field, value, { admin = false } = {}) {
  // Whitelist valid fields to prevent SQL injection
  const validFields = ['id', 'slug', 'author_id'];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid field: ${field}`);
  }

  if (admin) {
    const res = await pool.query(
      `
      SELECT * FROM blogs
       WHERE ${field} = $1
       ORDER BY created_at DESC;
    `,
      [value]
    );
    return res.rows;
  } else {
    const res = await pool.query(
      `
      SELECT * FROM blogs
       WHERE ${field} = $1
         AND status = 'published'
         AND deleted_at IS NULL
       ORDER BY created_at DESC;
    `,
      [value]
    );
    return res.rows;
  }
}

/**
 * Fetch all public (published & not deleted) blogs.
 * @returns {Promise<Blog[]>}
 */
async function getPublicBlogs() {
  const res = await pool.query(
    `
    SELECT * FROM blogs
     WHERE status = 'published'
       AND deleted_at IS NULL
    ORDER BY published_at DESC;
  `
  );
  return res.rows;
}

/**
 * Update arbitrary fields of a blog by its ID.
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Blog>}
 */
async function editBlog(id, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ['title', 'slug', 'summary', 'content', 'media_cid', 'status']) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const res = await pool.query(
    `
    UPDATE blogs
       SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *;
  `,
    values
  );
  return res.rows[0];
}

/**
 * Archive multiple blogs by setting status='archived' and deleted_at=NOW().
 * @param {string[]} ids - Array of blog UUIDs
 * @returns {Promise<void>}
 */
async function archiveBlogsBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');

  await pool.query(
    `
    UPDATE blogs
       SET status = 'archived',
           deleted_at = NOW(),
           updated_at = NOW()
     WHERE id IN (${placeholders});
  `,
    ids
  );
}

/**
 * Reactivate a soft-deleted (archived) blog by clearing deleted_at and setting status='published'.
 * @param {string} id
 * @returns {Promise<Blog|null>}
 */
async function reactivateBlog(id) {
  const res = await pool.query(
    `
    UPDATE blogs
       SET status = 'published',
           deleted_at = NULL,
           updated_at = NOW()
     WHERE id = $1
       AND status = 'archived'
     RETURNING *;
  `,
    [id]
  );
  return res.rows[0] || null;
}

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogByField,
  getPublicBlogs,
  editBlog,
  archiveBlogsBatch,
  reactivateBlog,
};
