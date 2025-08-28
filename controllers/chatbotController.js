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
    console.log("📌 Step 1: Reading DB file...");
    const dbPath = path.join(__dirname, "../config/db.json");
    const dbRaw = fs.readFileSync(dbPath, "utf-8");

    console.log("📌 Step 2: Parsing DB JSON...");
    const db = JSON.parse(dbRaw);

    console.log("📌 Step 3: Checking QA variations...");
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

    if (foundAnswer) {
      console.log("✅ Found answer in DB");
      return res.json({ response: foundAnswer });
    }

    console.log("📌 Step 4: Building knowledge base...");
    const knowledgeBase = db.qa
      .map((item) => `Q: ${item.variations[0]}\nA: ${item.answer}`)
      .join("\n\n");

    console.log("📌 Step 5: Sending request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for Teeny Tech Trek. Use ONLY the provided knowledge base to answer. " +
            "If you cannot find the answer in the knowledge base, politely say you don't know and suggest contacting the company.\n\n" +
            "Knowledge Base:\n" +
            knowledgeBase,
        },
        { role: "user", content: userMessage },
      ],
    });

    console.log("📌 Step 6: Extracting AI response...");
    const aiText =
      completion.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't think of a good answer.";

    console.log("✅ Sending AI response...");
    res.json({ response: aiText });
  } catch (err) {
    console.error("❌ Error in handleChat:", err.message);
    console.error(err.stack); // full stack trace
    res.status(500).json({ error: "Internal server error" });
  }
}


module.exports = { handleChat };
