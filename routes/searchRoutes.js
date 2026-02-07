const express = require("express");
const auth = require("../middleware/authMiddleware");
const { searchMessages } = require("../controllers/searchController");

const router = express.Router();

router.get("/messages", auth, searchMessages);

module.exports = router;
