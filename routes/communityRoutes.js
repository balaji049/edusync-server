const express = require("express");
const auth = require("../middleware/authMiddleware");

const {
  createCommunity,
  joinCommunity,
  getCommunities,
  getMembers   // ⬅ added
} = require("../controllers/communityController");

const router = express.Router();

// Create community
router.post("/create", auth, createCommunity);

// Join community
router.post("/join/:communityId", auth, joinCommunity);

// User's communities
router.get("/my", auth, getCommunities);

// ⭐ NEW — Fetch members of a community
router.get("/members/:communityId", auth, getMembers);

module.exports = router;
