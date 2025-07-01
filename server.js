import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API route
app.post('/translate', async (req, res) => {
    const { prompt } = req.body;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `You are a translation chatbot named Cosmic Translate. Your sole function is to translate user text to a specified language. The user will provide the text and the target language in a single message. Your response must consist ONLY of the translated text, with no extra comments, greetings, or explanations. If the user provides anything other than a translation request, or if you cannot determine the text and target language from their message, you MUST reply with the exact phrase: "I am a translation-only assistant. Please provide text to translate and a target language."`
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ translated: text });
    } catch (error) {
        console.error("API ERROR:", error.message);
        res.status(500).json({ translated: "Translation failed. Please try again later." });
    }
});

// Fallback for React-like routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
