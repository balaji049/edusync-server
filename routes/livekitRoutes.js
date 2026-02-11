const express = require("express");
const router = express.Router();
const { createLiveKitToken } = require("../services/livekit");

/**
 * POST /api/livekit/token
 * Returns LiveKit access token + server URL
 */
router.post("/token", (req, res) => {
  try {
    const { roomName, userId, userName, isHost } = req.body;

    if (!roomName || !userId) {
      return res.status(400).json({
        message: "roomName and userId are required",
      });
    }

    const token = createLiveKitToken({
      roomName,
      userId,
      userName,
      isHost,
    });

    // 🔍 DEBUG (SAFE)
    console.log("LIVEKIT TOKEN PREVIEW:", token.slice(0, 20));
    console.log("LIVEKIT URL:", process.env.LIVEKIT_URL);

    res.json({
      token, // ✅ string JWT
      url: process.env.LIVEKIT_URL, // ✅ wss://xxxx.livekit.cloud
    });
  } catch (err) {
    console.error("❌ LiveKit token error:", err);
    res.status(500).json({
      message: "Failed to create LiveKit token",
    });
  }
});

module.exports = router;
