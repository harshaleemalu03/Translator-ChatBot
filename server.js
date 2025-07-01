const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Add this if you're not using native fetch in Node 18+

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/translate', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const apiKey = process.env.API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    );

    const result = await response.json();
    console.log("Gemini Response:", JSON.stringify(result, null, 2)); // <--- Debug output

    let translated = "Translation failed.";
    if (
      result?.candidates &&
      result.candidates[0]?.content?.parts &&
      result.candidates[0].content.parts[0]?.text
    ) {
      translated = result.candidates[0].content.parts[0].text;
    } else if (result.error?.message) {
      translated = `Error: ${result.error.message}`;
    }

    res.json({ translated });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ translated: "Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
