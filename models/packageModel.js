// models/packageModel.js

/** @typedef {import('../types/types').Package} Package */

const pool = require('../config/db');

/**
 * Create a new package (subscription or event).
 *
 * @param {Package} data
 * @returns {Promise<Package>}
 */
async function createPackage(data) {
  const {
    name,
    slug,
    description = null,
    price,
    duration_days,
    is_active = true,
    package_type,
    event_id = null,
    capacity = null,
    package_registration_deadline = null,
  } = data;

  // Enforce consistency: event packages must have event_id; subscription packages cannot.
  if (package_type === 'event' && !event_id) {
    throw new Error('event_id is required when package_type is "event"');
  }
  if (package_type === 'subscription' && event_id) {
    throw new Error('event_id must be null when package_type is "subscription"');
  }

  const res = await pool.query(
    `
    INSERT INTO packages (
      name,
      slug,
      description,
      price,
      duration_days,
      is_active,
      deactivated_at,
      package_type,
      event_id,
      capacity,
      package_registration_deadline,
      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6,        -- is_active
      NULL,      -- deactivated_at defaults to NULL
      $7, $8, $9, $10,
      NOW(), NOW()
    )
    RETURNING *;
  `,
    [
      name,
      slug,
      description,
      price,
      duration_days,
      is_active,
      package_type,
      event_id,
      capacity,
      package_registration_deadline,
    ]
  );
  return res.rows[0];
}

/**
 * Fetch all packages (admin).
 *
 * @returns {Promise<Package[]>}
 */
async function getAllPackages() {
  const res = await pool.query(
    `
    SELECT *
      FROM packages
     ORDER BY created_at DESC;
  `
  );
  return res.rows;
}

/**
 * Fetch only published (is_active = TRUE) packages (public).
 *
 * @returns {Promise<Package[]>}
 */
async function getPublicPackages() {
  const res = await pool.query(
    `
    SELECT *
      FROM packages
     WHERE is_active = TRUE
     ORDER BY created_at DESC;
  `
  );
  return res.rows;
}

/**
 * Fetch packages by arbitrary field (admin).
 * Valid fields: id, slug, package_type, event_id, is_active.
 *
 * @param {string} field
 * @param {any} value
 * @returns {Promise<Package[]>}
 */
async function getPackagesByField(field, value) {
  const validFields = ['id', 'slug', 'package_type', 'event_id', 'is_active'];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid field: ${field}`);
  }
  const res = await pool.query(
    `
    SELECT *
      FROM packages
     WHERE ${field} = $1
     ORDER BY created_at DESC;
  `,
    [value]
  );
  return res.rows;
}

/**
 * Fetch public packages by arbitrary field (public).
 * Only returns rows where is_active = TRUE.
 *
 * @param {string} field
 * @param {any} value
 * @returns {Promise<Package[]>}
 */
async function getPublicPackagesByField(field, value) {
  const validFields = ['id', 'slug', 'package_type', 'event_id'];
  if (!validFields.includes(field)) {
    throw new Error(`Invalid field: ${field}`);
  }
  const res = await pool.query(
    `
    SELECT *
      FROM packages
     WHERE ${field} = $1
       AND is_active = TRUE
     ORDER BY created_at DESC;
  `,
    [value]
  );
  return res.rows;
}

/**
 * Update a package’s fields by ID (admin).
 * Allowed keys: name, slug, description, price, duration_days, is_active,
 * package_type, event_id, capacity, package_registration_deadline.
 *
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Package>}
 */
async function updatePackage(id, data) {
  const allowedKeys = [
    'name',
    'slug',
    'description',
    'price',
    'duration_days',
    'is_active',
    'package_type',
    'event_id',
    'capacity',
    'package_registration_deadline',
  ];

  const fields = [];
  const values = [];
  let idx = 1;

  // If toggling is_active from true→false, set deactivated_at; if false→true, clear it
  const togglingActive = data.is_active !== undefined;

  for (const key of allowedKeys) {
    if (data[key] !== undefined) {
      if (key === 'package_type') {
        // Ensures event_id presence/absence when changing type
        const newType = data[key];
        if (newType === 'event' && data.event_id == null) {
          throw new Error('event_id must be provided when switching to package_type="event"');
        }
        if (newType === 'subscription' && data.event_id != null) {
          throw new Error('event_id must be null when switching to package_type="subscription"');
        }
      }
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
  }

  if (togglingActive) {
    // Add deactivated_at handling
    if (data.is_active === false) {
      fields.push(`deactivated_at = NOW()`);
    } else {
      fields.push(`deactivated_at = NULL`);
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  const res = await pool.query(
    `
    UPDATE packages
       SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *;
  `,
    values
  );
  return res.rows[0];
}

/**
 * Deactivate (soft-delete) a package by ID (admin).
 *
 * @param {string} id
 * @returns {Promise<Package>}
 */
async function deactivatePackage(id) {
  const res = await pool.query(
    `
    UPDATE packages
       SET is_active = FALSE,
           deactivated_at = NOW(),
           updated_at = NOW()
     WHERE id = $1
       AND is_active = TRUE
     RETURNING *;
  `,
    [id]
  );
  return res.rows[0];
}

/**
 * Reactivate a soft-deleted package by ID (admin).
 *
 * @param {string} id
 * @returns {Promise<Package>}
 */
async function reactivatePackage(id) {
  const res = await pool.query(
    `
    UPDATE packages
       SET is_active = TRUE,
           deactivated_at = NULL,
           updated_at = NOW()
     WHERE id = $1
       AND is_active = FALSE
     RETURNING *;
  `,
    [id]
  );
  return res.rows[0];
}

module.exports = {
  createPackage,
  getAllPackages,
  getPublicPackages,
  getPackagesByField,
  getPublicPackagesByField,
  updatePackage,
  deactivatePackage,
  reactivatePackage,
};
