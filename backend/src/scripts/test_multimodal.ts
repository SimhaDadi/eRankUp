import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function testGemmaHigh() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["models/gemma-3-12b-it", "models/gemma-3-27b-it"];

    for (const modelName of models) {
        console.log(`Testing ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello.");
            console.log(`${modelName} Response:`, result.response.text());
        } catch (e) {
            console.error(`${modelName} FAIL:`, e.message);
        }
    }
}

testGemmaHigh();
