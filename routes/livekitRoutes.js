const express = require("express");
const { AccessToken } = require("livekit-server-sdk");

const router = express.Router();

/*
  POST /api/livekit/token
*/
router.post("/token", (req, res) => {
  try {
    const { roomName, userId, userName, isHost } = req.body;

    if (!roomName || !userId) {
      return res.status(400).json({
        error: "roomName and userId required",
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      return res.status(500).json({
        error: "LiveKit env vars missing",
      });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName || userId,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = token.toJwt(); // ✅ STRING

    console.log("✅ LiveKit token generated");

    res.json({
      token: jwt,
      url,
    });
  } catch (err) {
    console.error("❌ LiveKit token error:", err);
    res.status(500).json({
      error: "Failed to generate LiveKit token",
    });
  }
});

module.exports = router;
