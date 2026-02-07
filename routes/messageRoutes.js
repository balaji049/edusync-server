const express = require("express");
const auth = require("../middleware/authMiddleware");
const { sendMessage, getMessages } = require("../controllers/messageController");

const router = express.Router();

// Send a new message (protected)
router.post("/send", auth, sendMessage);

// Fetch all messages of a community (protected)
router.get("/list/:communityId", auth, getMessages);

module.exports = router;
