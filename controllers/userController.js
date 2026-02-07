// controllers/userController.js
const User = require("../models/User");

/* =========================
   GET LOGGED-IN USER PROFILE
   (ABSOLUTELY ISOLATED)
========================= */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .lean(); // 🔥 CRITICAL: prevent shared mongoose state

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/* =========================
   SANITIZE PROFILE UPDATE
========================= */
function sanitizeProfileUpdate(body) {
  const updates = {};

  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.bio === "string") updates.bio = body.bio;
  if (typeof body.headline === "string") updates.headline = body.headline;

  let profile = body.profile;
  if (typeof profile === "string") {
    try {
      profile = JSON.parse(profile);
    } catch {
      profile = null;
    }
  }

  if (profile && typeof profile === "object") {
    if (typeof profile.about === "string") {
      updates["profile.about"] = profile.about;
    }
    if (typeof profile.location === "string") {
      updates["profile.location"] = profile.location;
    }
    if (Array.isArray(profile.interests)) {
      updates["profile.interests"] = profile.interests;
    }
  }

  return updates;
}

/* =========================
   UPDATE LOGGED-IN PROFILE
========================= */
exports.updateProfile = async (req, res) => {
  try {
    const updates = sanitizeProfileUpdate(req.body);

    if (req.file) {
      updates["profile.avatarUrl"] = `/uploads/profile/${req.file.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true }
    )
      .select("-password")
      .lean(); // 🔥 CRITICAL

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* =========================
   LEADERBOARD (READ-ONLY)
========================= */
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "name role points messageCount aiQuestionsAsked streakDays profile.avatarUrl"
      )
      .sort({ points: -1 })
      .limit(20)
      .lean(); // 🔥 REQUIRED

    res.json(users);
  } catch (error) {
    console.error("getLeaderboard error:", error);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
};

/* =========================
   AWARD ACHIEVEMENT
========================= */
exports.awardAchievement = async (req, res) => {
  try {
    const { userId } = req.params;
    const { key, label, description } = req.body;

    if (!key || !label) {
      return res
        .status(400)
        .json({ message: "key and label are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = user.achievements?.some((a) => a.key === key);
    if (exists) {
      return res.json({
        message: "Achievement already awarded",
        achievements: user.achievements,
      });
    }

    user.achievements.push({
      key,
      label,
      description: description || "",
      awardedAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      message: "Achievement awarded",
      achievements: user.achievements,
    });
  } catch (error) {
    console.error("awardAchievement error:", error);
    res.status(500).json({ message: "Failed to award achievement" });
  }
};
