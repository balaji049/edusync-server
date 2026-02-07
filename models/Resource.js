const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // 🔥 CRITICAL FIX
    type: {
      type: String,
      enum: ["pdf", "file", "image", "link", "note"],
      required: true,
    },

    url: {
      type: String, // /uploads/resources/xxx.pdf OR external link
      required: true,
    },

    size: Number,       // optional (for files)
    mimeType: String,  // optional (for AI later)

    /* =========================
       📊 RESOURCE ANALYTICS
    ========================= */
    views: {
      type: Number,
      default: 0,
    },

    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resource", resourceSchema);
