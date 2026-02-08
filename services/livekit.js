const { AccessToken } = require("livekit-server-sdk");

function createLiveKitToken({
  roomName,
  userId,
  userName,
  isHost = false,
}) {
  if (!roomName || !userId) {
    throw new Error("roomName and userId are required");
  }

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: userId,
      name: userName || userId,
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,

    // 🔥 Host publishes, others subscribe
    canPublish: isHost,
    canSubscribe: true,
  });

  return token.toJwt();
}

module.exports = { createLiveKitToken };
