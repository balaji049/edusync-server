router.post("/token", (req, res) => {
  try {
    const { roomName, userId, userName, isHost } = req.body;

    const token = createLiveKitToken({
      roomName,
      userId,
      userName,
      isHost,
    });

    // 🔥 ADD THIS LINE
    console.log("LIVEKIT TOKEN PREVIEW:", token.slice(0, 20));

    res.json({
      token,
      url: process.env.LIVEKIT_URL,
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    res.status(500).json({ message: "Failed" });
  }
});


module.exports = router;
