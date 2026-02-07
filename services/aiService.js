// services/aiService.js
const OpenAI = require("openai");
require("dotenv").config();

/* =========================
   OPENAI CLIENT
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   CLOUDFLARE CONFIG
========================= */
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/* =========================
   CLOUDFLARE AI CALL
========================= */
async function askCloudflareAI(prompt) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "You are EduSync AI, an educational assistant. Answer clearly and concisely with examples if helpful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!data?.result?.response) {
    throw new Error("Cloudflare AI failed");
  }

  return data.result.response;
}

/* =========================
   MAIN AI FUNCTION
========================= */
async function askAI(prompt) {
  /* ---------- TRY OPENAI FIRST ---------- */
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are EduSync AI — a friendly community learning tutor. Explain concepts simply and clearly.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (openaiError) {
    console.warn("⚠️ OpenAI failed, switching to Cloudflare AI");

    /* ---------- FALLBACK TO CLOUDFLARE ---------- */
    try {
      return await askCloudflareAI(prompt);
    } catch (cfError) {
      console.error("❌ Cloudflare AI also failed");

      /* ---------- FINAL SAFE RESPONSE ---------- */
      return "⚠️ EduSync AI is temporarily unavailable. Please try again shortly.";
    }
  }
}

module.exports = askAI;


//const OpenAI = require("openai");
//require("dotenv").config();

//const openai = new OpenAI({
 // apiKey: process.env.OPENAI_API_KEY,
//});

/**
 * Ask AI to answer message contextually

async function askAI(question, context = "") {
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are EduSync AI — a friendly community learning tutor. Explain concepts simply, give examples and keep replies concise.",
      },
      {
        role: "user",
        content: context ? `${context}\nUser question: ${question}` : question,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });

    return response.choices[0].message.content;
  } catch (error) {
    return " Failed to generate AI reply.";
  }
}

module.exports = askAI;
 */