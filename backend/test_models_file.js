
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const logFile = 'model_test.log';
    fs.writeFileSync(logFile, "Starting Test...\n");

    if (!apiKey) {
        fs.appendFileSync(logFile, "No API Key found\n");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-1.5-flash",
        "models/gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "models/gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "models/gemini-1.5-flash-8b",
        "gemini-pro",
        "models/gemini-pro"
    ];

    for (const m of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Hi");
            fs.appendFileSync(logFile, `✅ SUCCESS: '${m}'\n`);
        } catch (e) {
            fs.appendFileSync(logFile, `❌ FAILED: '${m}' - ${e.message.split('\n')[0]}\n`);
        }
    }
}

listModels();
