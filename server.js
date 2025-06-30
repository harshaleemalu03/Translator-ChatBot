import express from "express";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.resolve();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/translate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    res.send({ translation: response });
  } catch (error) {
    console.error("Translation Error:", error);
    res.status(500).send("Something went wrong");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
