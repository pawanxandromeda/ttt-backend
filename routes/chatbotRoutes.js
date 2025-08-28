const express = require("express");
const router = express.Router();

// Must match the exact file name: chatbotController.js
const { handleChat } = require("../controllers/chatbotController");

router.post("/chat", handleChat);

module.exports = router;
