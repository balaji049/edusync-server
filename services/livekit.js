const { AccessToken } = require("livekit-server-sdk");

function createLiveKitToken({ roomName, userId, userName }) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: String(userId),
      name: userName || String(userId),
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt(); // 🔥 STRING ONLY
}

module.exports = { createLiveKitToken };
