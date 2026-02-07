const Message = require("../models/Message");

exports.searchMessages = async (req, res) => {
  try {
    const { q, communityId, channel, senderId, from, to } = req.query;

    if (!q || !communityId) {
      return res.status(400).json({ message: "Missing query" });
    }

    const filter = {
      community: communityId,
      $text: { $search: q },
    };

    if (channel) filter.channel = channel;
    if (senderId) filter.sender = senderId;

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const results = await Message.find(filter, {
      score: { $meta: "textScore" },
    })
      .populate("sender", "name role")
      .sort({ score: { $meta: "textScore" }, timestamp: -1 })
      .limit(50);

    res.json(
      results.map((m) => ({
        _id: m._id,
        text: m.text,
        channel: m.channel,
        timestamp: m.timestamp,
        sender: {
          id: m.sender?._id,
          name: m.sender?.name,
          role: m.sender?.role,
        },
      }))
    );
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};
