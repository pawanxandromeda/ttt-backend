const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chatbotcontroller");

router.post("/chat", handleChat);

module.exports = router;
