// routes/aiRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const { askAIWithContext } = require("../controllers/aiController");

const router = express.Router();

// 🔐 Private AI Assistant (Widget)
router.post("/ask", auth, askAIWithContext);

module.exports = router;
