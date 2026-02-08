const express = require("express");
const { AccessToken } = require("livekit-server-sdk");

const router = express.Router();

/*
  POST /api/livekit/token
  Body:
  {
    roomName: string,
    userId: string,
    userName?: string,
    isHost?: boolean
  }
*/
router.post("/token", (req, res) => {
  try {
    const { roomName, userId, userName, isHost } = req.body;

    if (!roomName || !userId) {
      return res
        .status(400)
        .json({ error: "roomName and userId required" });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      return res
        .status(500)
        .json({ error: "LiveKit env vars missing" });
    }

    // ✅ Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName || userId,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    // 🔥 CRITICAL: convert to STRING JWT
    const jwt = at.toJwt();

    return res.json({
      token: jwt, // ✅ STRING (eyJhbGciOi...)
      url,        // ✅ wss://xxxx.livekit.cloud
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    return res
      .status(500)
      .json({ error: "Failed to generate LiveKit token" });
  }
});

module.exports = router;
