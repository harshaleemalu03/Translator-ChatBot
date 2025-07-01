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

// ✅ App and Port
const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ TRANSLATION ROUTE: PLACE THIS HERE, NOT AT THE TOP!
app.post('/translate', async (req, res) => {
    const { prompt } = req.body;

    // Check if the prompt includes translation intent and target language
    const lowerPrompt = prompt.toLowerCase();
    const hasTargetLanguage = /(translate\s+.+\s+(to|into|in)\s+\w+)|(.+\s+(to|into|in)\s+\w+)/i.test(lowerPrompt);

    if (!hasTargetLanguage) {
        return res.json({
            translated: "I am a translation-only assistant. Please provide text and the target language for translation."
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Create model instance (no systemInstruction here!)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Add system instruction inside contents
        const result = await model.generateContent({
            contents: [
                {
                    role: "system",
                    parts: [
                        {
                            text: `You are an intelligent and strictly rule-bound translator chatbot whose sole function is to accurately translate user-provided text from one language to another, as clearly specified in the user's message. Each user input will contain the original text to be translated along with a clear indication of the target language. You must automatically detect the source language and translate the content precisely, preserving the original meaning, tone, and grammar in the target language. Your response must consist only of the translated text in the target language, without any explanations, comments, or additional formatting. If the user does not specify the target language, respond with: "Please specify the target language for translation." If the user provides anything other than a translation request, such as greetings, jokes, or unrelated questions, you must reply strictly with: "I am a translation-only assistant. Please provide text and the target language for translation."`
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
        console.error("API ERROR:", error.message);
        res.status(500).json({ translated: "Translation failed. Please try again later." });
    }
});


// Fallback for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
