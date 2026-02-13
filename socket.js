// socket.js — CLEAN BASELINE (COMMUNITY + TYPING + PRESENCE ONLY)
const { Server } = require("socket.io");

let io;

/* ============================
   USER & PRESENCE STATE
============================ */
const socketUserMap = new Map();     // socketId -> userId
const userSocketsMap = new Map();    // userId -> Set(socketId)
const communityMembers = new Map();  // room -> Set(userId)
const typingUsers = new Map();       // room -> Set(userId)

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
    console.log("🔌 Connected:", socket.id);

    /* ============================
       REGISTER USER (PRESENCE)
    ============================ */
    socket.on("register-user", (userId) => {
      if (!userId) return;

      socketUserMap.set(socket.id, userId);

      if (!userSocketsMap.has(userId)) {
        userSocketsMap.set(userId, new Set());
      }
      userSocketsMap.get(userId).add(socket.id);

      io.emit("onlineStatusUpdate", Array.from(userSocketsMap.keys()));
    });

    /* ============================
       COMMUNITY JOIN / LEAVE
    ============================ */
    socket.on("join-community", (room) => {
      const userId = socketUserMap.get(socket.id);
      if (!room || !userId) return;

      socket.join(room);

      if (!communityMembers.has(room)) {
        communityMembers.set(room, new Set());
      }
      communityMembers.get(room).add(userId);

      io.to(room).emit(
        "community-members-update",
        Array.from(communityMembers.get(room))
      );
    });

    socket.on("leave-community", (room) => {
      const userId = socketUserMap.get(socket.id);
      if (!room || !userId) return;

      socket.leave(room);

      communityMembers.get(room)?.delete(userId);

      io.to(room).emit(
        "community-members-update",
        Array.from(communityMembers.get(room) || [])
      );

      typingUsers.get(room)?.delete(userId);

      io.to(room).emit(
        "typing:update",
        Array.from(typingUsers.get(room) || [])
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

    socket.on("call:join", ({ communityId, channelId }) => {
  const room = `call:${communityId}:${channelId}`;
  socket.join(room);

  // 🔴 notify everyone: call is active
  io.to(room).emit("call:active", true);
});

socket.on("call:leave", ({ communityId, channelId }) => {
  const room = `call:${communityId}:${channelId}`;

  // If last user leaves (simplified version)
  io.to(room).emit("call:active", false);
});


    /* ============================
       DISCONNECT CLEANUP
    ============================ */
    socket.on("disconnect", () => {
      const userId = socketUserMap.get(socket.id);

      socketUserMap.delete(socket.id);
      userSocketsMap.get(userId)?.delete(socket.id);

      // Remove from all community rooms
      for (const [room, members] of communityMembers.entries()) {
        if (members.has(userId)) {
          members.delete(userId);

          io.to(room).emit(
            "community-members-update",
            Array.from(members)
          );
        }
      }

      io.emit(
        "onlineStatusUpdate",
        Array.from(userSocketsMap.keys())
      );

      console.log("❌ Disconnected:", socket.id);
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
