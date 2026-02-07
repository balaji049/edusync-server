/*const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },

  // ✅ FIXED: Accept string channel names like "general"
  channel: { type: String, default: null },

  text: { type: String, required: true },
  role: { type: String, enum: ["user", "teacher", "ai"], default: "user" },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
*/
// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null, // AI / system
  },

  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },

  channel: {
    type: String,
    default: "general",
  },

  type: {
    type: String,
    enum: ["text", "file", "image", "system", "ai"],
    default: "text",
  },

  text: {
    type: String,
  },

  /* 🔗 LINKED RESOURCE */
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    default: null,
  },

  role: {
    type: String,
    enum: ["user", "ai"],
    default: "user",
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

/* 🔍 TEXT SEARCH */
messageSchema.index({ text: "text" });

module.exports = mongoose.model("Message", messageSchema);
