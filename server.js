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

// Load env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("❌ Missing API_KEY in .env file");
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/translate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ translated: "Prompt is empty." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a translation-only assistant. Only translate if the user provides something like "hello to French", "translate I am fine in Spanish", or "I am a boy in Hindi". Otherwise, say: "I am a translation-only assistant. Please provide text and the target language for translation."

Prompt: ${prompt}`
            }
          ]
        }
      ]
    });

    const response = await result.response;
    const text = await response.text();
    res.json({ translated: text.trim() });

  } catch (error) {
    console.error("❌ Translation failed:", error.message);
    res.status(500).json({ translated: "Server error: Internal Server Error" });
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
