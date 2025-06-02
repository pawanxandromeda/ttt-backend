// controllers/registrationController.js
const registrationModel = require('../models/registrationModel');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createRegistration(req, res) {
  try {
    const {
      event_id,
      user_id,
      attendee_name,
      attendee_email,
      phone_number,
      package_id,
      order_id,
      status,
      waitlist_position,
    } = req.body;

    if (!event_id || !attendee_email || !package_id) {
      return res
        .status(400)
        .json({ error: 'event_id, attendee_email, and package_id are required.' });
    }

    const newReg = await registrationModel.createRegistration({
      event_id,
      user_id,
      attendee_name,
      attendee_email,
      phone_number,
      package_id,
      order_id,
      status,
      waitlist_position,
    });
    res.status(201).json(newReg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create registration.' });
  }
}

/**
 * Get registrations by arbitrary field (id, event_id, package_id, status, attendee_email, registration_token).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getRegistrations(req, res) {
  try {
    const { field, value } = req.query;
    if (!field || !value) {
      return res
        .status(400)
        .json({ error: 'Query parameters "field" and "value" are required.' });
    }
    const regs = await registrationModel.getRegistrationsByField(field, value);
    res.json(regs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
}

/**
 * Update a registration’s fields by ID.
 * Expects JSON body with any of { status, cancelled_at, attendee_name, attendee_email, phone_number, order_id, waitlist_position }.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateRegistration(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await registrationModel.updateRegistration(id, data);
    if (!updated) {
      return res.status(404).json({ error: 'Registration not found.' });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update registration.' });
  }
}

/**
 * Cancel a registration using its registration_token.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function cancelRegistrationByToken(req, res) {
  try {
    const { token } = req.params;
    const cancelled = await registrationModel.cancelByToken(token);
    if (!cancelled) {
      return res.status(404).json({ error: 'Invalid or already cancelled token.' });
    }
    res.json({ message: 'Registration cancelled successfully.', registration: cancelled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel registration.' });
  }
}

/**
 * Get all registrations for the authenticated user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getRegistrationsByUser(req, res) {
  try {
    const userId = req.user.id; // assume req.user is set by authentication middleware
    const regs = await registrationModel.getRegistrationsByUserId(userId);
    res.json(regs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user registrations.' });
  }
}

/**
 * Promote the next waitlisted registration for a package.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function promoteNextInWaitlist(req, res) {
  try {
    const { package_id } = req.params;
    const promoted = await registrationModel.promoteNextWaitlisted(package_id);
    if (!promoted) {
      return res
        .status(404)
        .json({ message: 'No one is on the waitlist for this package.' });
    }
    res.json({ message: 'Promoted next waitlisted registration.', registration: promoted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to promote next waitlisted.' });
  }
}

/**
 * Count how many are registered or waitlisted for a package.
 * Query params: package_id, status
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getCountByPackage(req, res) {
  try {
    const { package_id, status } = req.query;
    if (!package_id || !status) {
      return res
        .status(400)
        .json({ error: 'Query parameters "package_id" and "status" are required.' });
    }
    const validStatuses = ['registered', 'waitlisted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status parameter.' });
    }
    const cnt = await registrationModel.countByPackageAndStatus(package_id, status);
    res.json({ package_id, status, count: cnt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to count registrations.' });
  }
}

module.exports = {
  createRegistration,
  getRegistrations,
  updateRegistration,
  cancelRegistrationByToken,
  getRegistrationsByUser,
  promoteNextInWaitlist,
  getCountByPackage,
};
