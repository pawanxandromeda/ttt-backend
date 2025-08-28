const express = require("express");
const router = express.Router();
const { bookConsultation } = require("../controllers/bookingController");

// POST endpoint for booking consultation
router.post("/book", bookConsultation);

module.exports = router;  // ✅ export only router
