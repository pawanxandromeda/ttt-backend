const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chatbotController");

router.post("/chat", handleChat);

module.exports = router; // ✅ not an object
