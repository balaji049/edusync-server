const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
});

module.exports = mongoose.model("Channel", channelSchema);
