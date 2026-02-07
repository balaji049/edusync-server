const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  getLeaderboard,
  awardAchievement
} = require("../controllers/userController");
const { uploadProfile } = require("../middleware/upload");

const router = express.Router();

/**
 * GET /api/users/me
 * Get logged-in user's profile
 */
router.get("/me", auth, getProfile);

/**
 * PUT /api/users/me
 * Update logged-in user's profile (text + avatar)
 */
router.put(
  "/me",
  auth,
  uploadProfile.single("avatar"), // 👈 consistent field name
  updateProfile
);

/**
 * GET /api/users/leaderboard
 * Top users by points
 */
router.get("/leaderboard", auth, getLeaderboard);

/**
 * POST /api/users/award/:userId
 * Award achievement (admin/teacher)
 */
router.post("/award/:userId", auth, awardAchievement);

module.exports = router;
