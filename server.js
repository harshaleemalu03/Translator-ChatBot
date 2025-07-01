// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a translation chatbot named Cosmic Translate. Your sole function is to translate user text to a specified language. The user will provide the text and the target language in a single message. Your response must consist ONLY of the translated text, with no extra comments, greetings, or explanations. If the user provides anything other than a translation request, or if you cannot determine the text and target language from their message, you MUST reply with the exact phrase: \"I am a translation-only assistant. Please provide text to translate and a target language.\""
});

app.post("/translate", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const result = await model.generateContent(prompt);
    const translated = result.response.text();
    res.json({ translated });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.use(express.static("public"));

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
