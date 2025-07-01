import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: Missing API_KEY in .env");
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /translate route
app.post('/translate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ translated: "❗ Please enter text to translate." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Start chat with system prompt
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.2,
      },
      history: [],
      systemInstruction: {
        role: "system",
        parts: [{
          text: `You are an intelligent and strictly rule-bound translator chatbot whose sole function is to accurately translate user-provided text from one language to another, as clearly specified in the user's message. Each user input will contain the original text to be translated along with a clear indication of the target language. You must automatically detect the source language and translate the content precisely, preserving the original meaning, tone, and grammar in the target language. Your response must consist only of the translated text in the target language, without any explanations, comments, or additional metadata. If the user does not specify the target language, you must respond with: "Please specify the target language for translation." If the user provides anything other than a translation request, such as greetings, jokes, or unrelated questions, you should reply with: "I am a translation-only assistant. Please provide text and the target language for translation." You are not permitted to answer questions, explain translations, or engage in general conversation. Only proceed with translation when both the source text and the intended target language are clearly provided.`
        }]
      }
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = await response.text();

    res.json({ translated: text.trim() });

  } catch (error) {
    console.error("❌ Server Error:", error.message);
    res.status(500).json({ translated: "⚠️ Internal Server Error. Please try again later." });
  }
});

// Handle frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
