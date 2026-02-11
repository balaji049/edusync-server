/*const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const { init } = require("./socket");

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: "*",          // allow LAN devices
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Static uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/community", require("./routes/communityRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));

// Health check
app.get("/", (req, res) => {
  res.send("EduSync server running!");
});

const server = http.createServer(app);

// 🔌 Attach Socket.IO (includes mediasoup)
init(server);

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});    */
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");

const connectDB = require("./config/db");
const { init } = require("./socket");

dotenv.config();
connectDB();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());


/* =========================
   STATIC FILES
========================= */
app.use("/uploads", express.static("uploads"));

/* =========================
   API ROUTES
========================= */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/community", require("./routes/communityRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));

/* =========================
   SERVE REACT BUILD
========================= 
const clientBuildPath = path.join(__dirname, "../edusync-client/build");
app.use(express.static(clientBuildPath));

app.use((req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});
*/
/* =========================
   HTTPS SERVER + SOCKET
========================= */
const server = http.createServer(app);

init(server);

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 HTTPS Server running on port ${PORT}`);
});
