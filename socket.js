// socket.js — FINAL (COMMUNITY + TYPING + P2P VOICE & VIDEO)
const { Server } = require("socket.io");

let io;

/* ============================
   STATE
============================ */
const socketUserMap = new Map();      // socketId -> userId
const userSocketsMap = new Map();     // userId -> Set(socketId)
const communityMembers = new Map();   // communityId -> Set(userId)
const typingUsers = new Map();        // room -> Set(userId)

/*
  callRoom format:
  call:<communityId>:<channelId>
*/
const activeCalls = {}; // room -> Set(socketId)

/* ============================
   INIT SOCKET SERVER
============================ */
function init(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    /* ============================
       REGISTER USER
    ============================ */
    socket.on("register-user", (userId) => {
      if (!userId) return;

      socketUserMap.set(socket.id, userId);

      if (!userSocketsMap.has(userId)) {
        userSocketsMap.set(userId, new Set());
      }
      userSocketsMap.get(userId).add(socket.id);

      io.emit(
        "onlineStatusUpdate",
        Array.from(userSocketsMap.keys())
      );
    });

    /* ============================
       COMMUNITY JOIN / LEAVE
    ============================ */
    socket.on("join-community", (communityId) => {
      const userId = socketUserMap.get(socket.id);
      if (!communityId || !userId) return;

      socket.join(communityId);

      if (!communityMembers.has(communityId)) {
        communityMembers.set(communityId, new Set());
      }
      communityMembers.get(communityId).add(userId);

      io.to(communityId).emit(
        "community-members-update",
        Array.from(communityMembers.get(communityId))
      );
    });

    socket.on("leave-community", (communityId) => {
      const userId = socketUserMap.get(socket.id);
      if (!communityId || !userId) return;

      socket.leave(communityId);
      communityMembers.get(communityId)?.delete(userId);

      io.to(communityId).emit(
        "community-members-update",
        Array.from(communityMembers.get(communityId) || [])
      );
    });

    /* ============================
       TYPING INDICATOR
    ============================ */
    socket.on("typing:start", ({ room }) => {
      const userId = socketUserMap.get(socket.id);
      if (!room || !userId) return;

      if (!typingUsers.has(room)) {
        typingUsers.set(room, new Set());
      }
      typingUsers.get(room).add(userId);

      io.to(room).emit(
        "typing:update",
        Array.from(typingUsers.get(room))
      );
    });

    socket.on("typing:stop", ({ room }) => {
      const userId = socketUserMap.get(socket.id);
      if (!room || !userId) return;

      typingUsers.get(room)?.delete(userId);

      io.to(room).emit(
        "typing:update",
        Array.from(typingUsers.get(room) || [])
      );
    });

    /* ============================
       📞 P2P CALL (VOICE + VIDEO)
    ============================ */
    socket.on("call:join", ({ communityId, channelId }) => {
      const room = `call:${communityId}:${channelId}`;
      socket.join(room);

      if (!activeCalls[room]) {
        activeCalls[room] = new Set();
      }

      // Send existing peer socket IDs to NEW user
      socket.emit(
        "call:peers",
        [...activeCalls[room]]
      );

      activeCalls[room].add(socket.id);

      // Notify others that a new peer joined
      socket.to(room).emit("call:user-joined", socket.id);
    });

    /* ============================
       WEBRTC SIGNALING
    ============================ */
    socket.on("call:offer", ({ to, offer }) => {
      io.to(to).emit("call:offer", {
        from: socket.id,
        offer,
      });
    });

    socket.on("call:answer", ({ to, answer }) => {
      io.to(to).emit("call:answer", {
        from: socket.id,
        answer,
      });
    });

    socket.on("call:ice", ({ to, candidate }) => {
      io.to(to).emit("call:ice", {
        from: socket.id,
        candidate,
      });
    });

    socket.on("call:leave", ({ communityId, channelId }) => {
      const room = `call:${communityId}:${channelId}`;

      activeCalls[room]?.delete(socket.id);

      socket.to(room).emit("call:user-left", socket.id);

      if (activeCalls[room]?.size === 0) {
        delete activeCalls[room];
      }
    });

    /* ============================
       DISCONNECT CLEANUP
    ============================ */
    socket.on("disconnect", () => {
      const userId = socketUserMap.get(socket.id);

      socketUserMap.delete(socket.id);
      userSocketsMap.get(userId)?.delete(socket.id);

      for (const room in activeCalls) {
        if (activeCalls[room].has(socket.id)) {
          activeCalls[room].delete(socket.id);

          socket.to(room).emit("call:user-left", socket.id);

          if (activeCalls[room].size === 0) {
            delete activeCalls[room];
          }
        }
      }

      io.emit(
        "onlineStatusUpdate",
        Array.from(userSocketsMap.keys())
      );

      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
}

/* ============================
   ACCESS IO INSTANCE
============================ */
function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { init, getIO };
