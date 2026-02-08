import express from "express";
import { AccessToken } from "livekit-server-sdk";

const router = express.Router();

router.post("/token", async (req, res) => {
  try {
    const { roomName, userId, userName, isHost } = req.body;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !url) {
      return res.status(500).json({ error: "LiveKit env missing" });
    }

    // ✅ Create token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    // 🔥 THIS IS THE KEY FIX
    const jwt = at.toJwt();   // ← STRING

    return res.json({
      token: jwt,             // ✅ STRING
      url,                    // ✅ wss://xxx.livekit.cloud
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

export default router;
