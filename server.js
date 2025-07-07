import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

// --- SETUP ---
// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
const apiKey = process.env.API_KEY;

// Check for API key at startup
if (!apiKey) {
  console.error("❌ FATAL ERROR: Missing API_KEY in your .env file.");
  process.exit(1); // Exit the process if the key is missing
}

// --- INITIALIZE AI CLIENT (SINGLETON PATTERN) ---
// Create the AI client and model instances *once* when the server starts.
// This prevents re-creating them on every request, which is crucial for performance and stability.
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  // The system instruction is part of the model's configuration
  systemInstruction: {
    role: "system",
    parts: [{
      text: `You are an intelligent and strictly rule-bound translator chatbot. Your sole function is to accurately translate user-provided text.
- You must automatically detect the source language.
- Your response must consist *only* of the translated text in the target language. Do not add any explanations, comments, greetings, or extra text.
- If the user does not specify a target language, you must respond with: "Please specify the target language for translation."
- If the user provides anything other than a translation request (e.g., a general question, a greeting), you must respond with: "I am a translation-only assistant. Please provide text and the target language for translation."`
    }]
  }
});

// --- EXPRESS APP SETUP ---
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ENDPOINT ---
app.post('/translate', async (req, res) => {
  const { prompt } = req.body;

  // 1. Input Validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ translated: "❗ Please enter text to translate." });
  }

  // 1.5 Translation Intent Check
  const lowerPrompt = prompt.toLowerCase();
  const looksLikeTranslation =
    lowerPrompt.includes("translate") ||
    lowerPrompt.includes(" to ") ||
    lowerPrompt.includes(" in ") ||
    lowerPrompt.includes("language");

  if (!looksLikeTranslation) {
    return res.status(400).json({
      translated: "I am a translation-only assistant. Please provide text and the target language for translation."
    });
  }

  try {
    // 2. Use the more direct `generateContent` for single-turn requests.
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. Send the clean, trimmed text back to the client
    res.json({ translated: text.trim() });

  } catch (error) {
    // 4. Enhanced Error Logging for better debugging on the server
    console.error("❌ API Call Failed:", error);
    res.status(500).json({ translated: "⚠️ An error occurred with the translation service. Please try again later." });
  }
});

// Fallback for any other GET request to serve the frontend (for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- START SERVER ---
app.listen(port, () => {
  console.log(`✅ Server is running and listening on http://localhost:${port}`);
});
