import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config();
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("❌ API_KEY not found in .env");
  process.exit(1);
}

// Setup Express
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /translate
app.post('/translate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ translated: "Prompt is empty." });
  }

  // Check if translation intent is present
  const isTranslationRequest = /(translate\s.+\sto\s\w+)|(.+\sto\s\w+)|(.+\sin\s\w+)/i.test(prompt);

  if (!isTranslationRequest) {
    return res.json({
      translated:
        "I am a translation-only assistant. Please provide text and the target language for translation."
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "system",
          parts: [
            {
              text: `You are an intelligent and strictly rule-bound translator chatbot whose sole function is to accurately translate user-provided text from one language to another, as clearly specified in the user's message. Your response must ONLY be the translated text — no extra explanations or comments. If user gives anything other than a translation request, say: "I am a translation-only assistant. Please provide text and the target language for translation."`
            }
          ]
        },
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    const response = await result.response;
    const text = response.text().trim();
    res.json({ translated: text });
  } catch (error) {
    console.error("❌ API ERROR:", error);
    res.status(500).json({ translated: "Translation failed. Please try again later." });
  }
});

// Fallback for frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
