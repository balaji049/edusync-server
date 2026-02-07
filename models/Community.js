const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,

  // Updated members format
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      joinedAt: { type: Date, default: Date.now }
    }
  ],

  channels: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Channel" }
  ],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Community", communitySchema);
