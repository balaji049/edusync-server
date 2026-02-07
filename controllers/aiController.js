// controllers/aiController.js
const Message = require("../models/Message");
const askAI = require("../services/aiService");

/**
 * PRIVATE AI ASSISTANT (Widget)
 * - No sockets
 * - No DB writes
 * - Context-aware
 */
exports.askAIWithContext = async (req, res) => {
  try {
    const { question, communityId, channelId } = req.body;

    if (!question || !communityId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // 🔹 Fetch recent messages (last 10)
    const recentMessages = await Message.find({
      community: communityId,
      channel: channelId || null,
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("text role");

    const context = recentMessages
      .reverse()
      .map((m) => `${m.role}: ${m.text}`)
      .join("\n");

    const prompt = `
You are EduSync AI, an educational assistant.

Use the following discussion context if helpful.

Context:
${context || "No prior discussion"}

User Question:
${question}
`;

    const answer = await askAI(prompt);

    res.json({ answer });
  } catch (error) {
    console.error("AI Widget Error:", error);
    res.status(500).json({ message: "AI failed" });
  }
};
