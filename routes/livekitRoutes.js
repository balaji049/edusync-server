const express = require("express");
const router = express.Router();
const { createLiveKitToken } = require("../services/livekit");

router.post("/token", (req, res) => {
  const { roomName, userId, userName } = req.body;

  if (!roomName || !userId) {
    return res.status(400).json({ message: "Missing params" });
  }

  const token = createLiveKitToken({ roomName, userId, userName });

  res.json({
    token, // ✅ STRING
    url: process.env.LIVEKIT_URL, // wss://xxxx.livekit.cloud
  });
});

module.exports = router;
