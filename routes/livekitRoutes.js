const express = require("express");
const router = express.Router();
const { createLiveKitToken } = require("../services/livekit");

// POST /api/livekit/token
router.post("/token", (req, res) => {
  try {
    const {
      roomName,
      userId,
      userName,
      isHost,
    } = req.body;

    if (!roomName || !userId) {
      return res
        .status(400)
        .json({ message: "roomName and userId required" });
    }

    const token = createLiveKitToken({
      roomName,
      userId,
      userName,
      isHost,
    });

    res.json({
      token,
      url: process.env.LIVEKIT_URL,
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    res.status(500).json({
      message: "Failed to create LiveKit token",
    });
  }
});

module.exports = router;
