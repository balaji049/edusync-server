// socket.js — FINAL (COMMUNITY + TYPING + RESOURCES + P2P VOICE + VIDEO)
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
   P2P CALL STATE (VOICE + VIDEO)
============================ */
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
    console.log("🔌 Connected:", socket.id);

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

      if (!typingUsers.has(room)) typingUsers.set(room, new Set());
      typingUsers.get(room).add(userId);

      io.to(room).emit("typing:update", Array.from(typingUsers.get(room)));
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
       🔊 P2P CALL (VOICE + VIDEO)
    ============================ */
    socket.on("call:join", ({ communityId, channelId, user }) => {
      const room = `call:${communityId}:${channelId}`;
      socket.join(room);

      if (!activeCalls[room]) activeCalls[room] = new Set();
      activeCalls[room].add(socket.id);

      socket.emit(
        "call:existing-users",
        [...activeCalls[room]].filter((id) => id !== socket.id)
      );

      socket.to(room).emit("call:user-joined", {
        socketId: socket.id,
        user,
      });
    });

    socket.on("call:offer", ({ to, offer }) => {
      io.to(to).emit("call:offer", { from: socket.id, offer });
    });

    socket.on("call:answer", ({ to, answer }) => {
      io.to(to).emit("call:answer", { from: socket.id, answer });
    });

    socket.on("call:ice", ({ to, candidate }) => {
      io.to(to).emit("call:ice", { from: socket.id, candidate });
    });

    socket.on("call:leave", ({ communityId, channelId }) => {
      const room = `call:${communityId}:${channelId}`;
      activeCalls[room]?.delete(socket.id);
      socket.to(room).emit("call:user-left", { socketId: socket.id });

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
          socket.to(room).emit("call:user-left", {
            socketId: socket.id,
          });

          if (activeCalls[room].size === 0) {
            delete activeCalls[room];
          }
        }
      }

      io.emit("onlineStatusUpdate", Array.from(userSocketsMap.keys()));
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
