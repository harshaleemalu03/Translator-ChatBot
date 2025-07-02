import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("❌ Missing API_KEY in .env");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Translation Endpoint with filtering
app.post('/translate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ translated: "❗ Please enter text to translate." });
  }

  const lowerPrompt = prompt.toLowerCase();
  const keywords = ["translate", "in", "to", "into"];

  const isTranslationRequest = keywords.some(keyword => lowerPrompt.includes(keyword));
  if (!isTranslationRequest) {
    return res.json({
      translated: "I am a translation-only assistant. Please provide text and the target language for translation."
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [],
      generationConfig: { temperature: 0.3 },
      systemInstruction: {
        role: "system",
        parts: [{
          text: `You are an intelligent and strictly rule-bound translator chatbot whose sole function is to accurately translate user-provided text from one language to another, as clearly specified in the user's message. Each user input will contain the original text to be translated along with a clear indication of the target language. You must automatically detect the source language and translate the content precisely, preserving the original meaning, tone, and grammar in the target language. Your response must consist only of the translated text in the target language, without any explanations, comments, or additional metadata. If the user does not specify the target language, you must respond with: "Please specify the target language for translation." If the user provides anything other than a translation request, such as greetings, jokes, or unrelated questions, you should reply with: "I am a translation-only assistant. Please provide text and the target language for translation."`
        }]
      }
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.json({ translated: text.trim() });

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    res.status(500).json({ translated: "⚠️ Internal Server Error: Please try again later." });
  }
});

// Fallback for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
