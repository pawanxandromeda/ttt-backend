const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function normalizeText(text) {
  return text.toLowerCase().trim();
}

async function handleChat(req, res) {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // 1. Read from config/db.json
    const dbPath = path.join(__dirname, "../config/db.json");
    const dbRaw = fs.readFileSync(dbPath, "utf-8");
    const db = JSON.parse(dbRaw);

    // 2. Check QA variations for an exact match
    let foundAnswer = null;
    if (db.qa && Array.isArray(db.qa)) {
      for (const item of db.qa) {
        if (
          item.variations.some(
            (v) => normalizeText(v) === normalizeText(userMessage)
          )
        ) {
          foundAnswer = item.answer;
          break;
        }
      }
    }

    // 3. If found in DB, return it immediately
    if (foundAnswer) {
      return res.json({ response: foundAnswer });
    }

    // 4. If not found, send DB as context to OpenAI
    const knowledgeBase = db.qa
      .map(
        (item) =>
          `Q: ${item.variations[0]}\nA: ${item.answer}`
      )
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for Teeny Tech Trek. Use ONLY the provided knowledge base to answer. " +
            "If you cannot find the answer in the knowledge base, politely say you don't know and suggest contacting the company.\n\n" +
            "Knowledge Base:\n" +
            knowledgeBase
        },
        { role: "user", content: userMessage }
      ]
    });

    const aiText =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't think of a good answer.";

    res.json({ response: aiText });
  } catch (err) {
    console.error("Error in handleChat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { handleChat };
