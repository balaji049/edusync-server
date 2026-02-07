/*
const Message = require("../models/Message");
const User = require("../models/User");
const { getIO } = require("../socket");
const askAI = require("../services/aiService");

/* =====================================================
   Helper: award achievement if not already present
===================================================== 
async function awardAchievementIfNeeded(userId, payload) {
  if (!userId || !payload?.key) return;

  const user = await User.findById(userId);
  if (!user) return;

  const exists = user.achievements?.some(
    (a) => a.key === payload.key
  );
  if (exists) return;

  user.achievements.push({
    key: payload.key,
    label: payload.label,
    description: payload.description || "",
    awardedAt: new Date(),
  });

  await user.save();
}

/* =====================================================
   SEND MESSAGE (USER)
===================================================== 
exports.sendMessage = async (req, res) => {
  try {
    const { communityId, channelId = "general", text } = req.body;
    const userId = req.user.userId;

    if (!communityId || !text?.trim()) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    /* 1️ Save message 
    const message = await Message.create({
      sender: userId,
      community: communityId,
      channel: channelId,
      text,
      role: "user",
    });

    const populated = await message.populate(
      "sender",
      "name role"
    );

    /* 2️ Emit to CHANNEL ROOM 
    const room = `${communityId}:${channelId}`;

    getIO().to(room).emit("message-received", {
      _id: populated._id.toString(),
      text: populated.text,
      role: "user",
      channel: populated.channel,
      timestamp: populated.timestamp,

      senderId: populated.sender._id.toString(),
      senderName: populated.sender.name,
      senderRole: populated.sender.role,
    });

    /* 3️ Respond immediately 
    res.status(201).json({ success: true });

    /* 4️ Update user stats 
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { messageCount: 1, points: 1, "stats.posts": 1 },
        $set: { lastActive: new Date() },
      },
      { new: true }
    ).lean();

    if (updatedUser?.messageCount >= 10) {
      await awardAchievementIfNeeded(userId, {
        key: "messages-10",
        label: "First 10 Messages!",
        description: "Participated actively in discussions.",
      });
    }

    /* 5️ Trigger AI reply 
    generateAIReply(communityId, channelId, text, userId);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

/* =====================================================
   AI REPLY (ASYNC)
===================================================== 
async function generateAIReply(
  communityId,
  channelId,
  question,
  userId
) {
  try {
    const recentMessages = await Message.find({
      community: communityId,
      channel: channelId,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .select("text");

    const context = recentMessages
      .map((m) => m.text)
      .join("\n");

    const reply = await askAI(question, context);

    const aiMsg = await Message.create({
      sender: null,
      community: communityId,
      channel: channelId,
      text: reply,
      role: "ai",
    });

    const room = `${communityId}:${channelId}`;

    getIO().to(room).emit("message-received", {
      _id: aiMsg._id.toString(),
      text: reply,
      role: "ai",
      channel: aiMsg.channel,
      timestamp: aiMsg.timestamp,

      senderId: "ai",
      senderName: "EduSync AI",
      senderRole: "ai",
    });

    if (userId) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { aiQuestionsAsked: 1, points: 2 },
          $set: { lastActive: new Date() },
        },
        { new: true }
      ).lean();

      if (updatedUser?.aiQuestionsAsked >= 5) {
        await awardAchievementIfNeeded(userId, {
          key: "ai-questions-5",
          label: "Curious Learner",
          description: "Asked 5 questions to EduSync AI.",
        });
      }
    }
  } catch (error) {
    console.error("AI reply error:", error.message);
  }
}

/* =====================================================
   GET MESSAGES (INITIAL LOAD)
===================================================== 
exports.getMessages = async (req, res) => {
  try {
    const { communityId } = req.params;

    const messages = await Message.find({ community: communityId })
      .populate("sender", "name role")
      .sort({ timestamp: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id.toString(),
        text: m.text,
        role: m.role,
        channel: m.channel,
        timestamp: m.timestamp,

        senderId:
          m.role === "ai"
            ? "ai"
            : m.sender?._id?.toString(),
        senderName:
          m.role === "ai"
            ? "EduSync AI"
            : m.sender?.name,
        senderRole:
          m.role === "ai"
            ? "ai"
            : m.sender?.role,
      }))
    );
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Failed to load messages" });
  }
};
*/
const Message = require("../models/Message");
const User = require("../models/User");
const { getIO } = require("../socket");
const askAI = require("../services/aiService"); // ❌ DISABLED (API COST)

/* =====================================================
   Helper: award achievement if not already present
===================================================== */
async function awardAchievementIfNeeded(userId, payload) {
  if (!userId || !payload?.key) return;

  const user = await User.findById(userId);
  if (!user) return;

  const exists = user.achievements?.some(
    (a) => a.key === payload.key
  );
  if (exists) return;

  user.achievements.push({
    key: payload.key,
    label: payload.label,
    description: payload.description || "",
    awardedAt: new Date(),
  });

  await user.save();
}

/* =====================================================
   AI TRIGGER CHECK — ONLY @ai
===================================================== */
function extractAIQuestion(text) {
  if (!text) return null;

  const trimmed = text.trim();

  if (!trimmed.toLowerCase().startsWith("@ai")) {
    return null;
  }

  const question = trimmed.replace(/^@ai/i, "").trim();
  return question.length > 0 ? question : null;
}

/* =====================================================
   SEND MESSAGE (USER)
===================================================== */
exports.sendMessage = async (req, res) => {
  try {
    const { communityId, channelId = "general", text } = req.body;
    const userId = req.user.userId;

    if (!communityId || !text?.trim()) {
      return res.status(400).json({ message: "Invalid message data" });
    }

    /* 1️⃣ Save USER message */
    const message = await Message.create({
      sender: userId,
      community: communityId,
      channel: channelId,
      text,
      role: "user",
    });

    const populated = await message.populate("sender", "name role");

    /* 2️⃣ Emit USER message */
    const room = `${communityId}:${channelId}`;

    getIO().to(room).emit("message-received", {
      _id: populated._id.toString(),
      text: populated.text,
      role: "user",
      channel: populated.channel,
      timestamp: populated.timestamp,

      senderId: populated.sender._id.toString(),
      senderName: populated.sender.name,
      senderRole: populated.sender.role,
    });

    /* 3️⃣ Respond immediately */
    res.status(201).json({ success: true });

    /* 4️⃣ Update stats */
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { messageCount: 1, points: 1, "stats.posts": 1 },
        $set: { lastActive: new Date() },
      },
      { new: true }
    ).lean();

    if (updatedUser?.messageCount >= 10) {
      await awardAchievementIfNeeded(userId, {
        key: "messages-10",
        label: "First 10 Messages!",
        description: "Participated actively in discussions.",
      });
    }

    /* =====================================================
       5️⃣ AI RESPONSE — ONLY WHEN @ai IS USED
       ❌ Everything else is DISABLED
    ===================================================== */

    const aiQuestion = extractAIQuestion(text);

    if (aiQuestion) {
      
      generateAIReply(
        communityId,
        channelId,
        aiQuestion,
        userId
      );
      
    }

  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

/* =====================================================
   AI REPLY — DISABLED (SAFE PLACEHOLDER)
===================================================== */


async function generateAIReply(
  communityId,
  channelId,
  question,
  userId
) {
  try {
    const recentMessages = await Message.find({
      community: communityId,
      channel: channelId,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .select("text");

    const context = recentMessages.map((m) => m.text).join("\n");

    const reply = await askAI(question, context);

    const aiMsg = await Message.create({
      sender: null,
      community: communityId,
      channel: channelId,
      text: reply,
      role: "ai",
    });

    const room = `${communityId}:${channelId}`;

    getIO().to(room).emit("message-received", {
      _id: aiMsg._id.toString(),
      text: reply,
      role: "ai",
      channel: aiMsg.channel,
      timestamp: aiMsg.timestamp,

      senderId: "ai",
      senderName: "EduSync AI",
      senderRole: "ai",
    });
  } catch (error) {
    console.error("AI reply error:", error.message);
  }
}


/* =====================================================
   GET MESSAGES (INITIAL LOAD)
===================================================== */
exports.getMessages = async (req, res) => {
  try {
    const { communityId } = req.params;

    const messages = await Message.find({ community: communityId })
      .populate("sender", "name role")
      .sort({ timestamp: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id.toString(),
        text: m.text,
        role: m.role,
        channel: m.channel,
        timestamp: m.timestamp,

        senderId:
          m.role === "ai"
            ? "ai"
            : m.sender?._id?.toString(),
        senderName:
          m.role === "ai"
            ? "EduSync AI"
            : m.sender?.name,
        senderRole:
          m.role === "ai"
            ? "ai"
            : m.sender?.role,
      }))
    );
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Failed to load messages" });
  }
};
