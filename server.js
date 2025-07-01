const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const cors = require('cors');

// Load .env variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Set your Gemini API key in a .env file
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static frontend

// === Translation Route ===
app.post('/translate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ translated: "Missing translation prompt." });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
        "You are a translation chatbot named Cosmic Translate. Your sole function is to translate user text to a specified language. The user will provide the text and the target language in a single message. Your response must consist ONLY of the translated text, with no extra comments, greetings, or explanations. If the user provides anything other than a translation request, or if you cannot determine the text and target language from their message, you MUST reply with the exact phrase: \"I am a translation-only assistant. Please provide text to translate and a target language.\"",
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ translated: text });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ translated: "Error occurred while translating." });
  }
});

// === Launch Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
