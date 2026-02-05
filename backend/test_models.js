
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-1.5-flash",
        "models/gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "models/gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "models/gemini-1.5-pro",
        "gemini-1.0-pro"
    ];

    console.log("Testing model availability...");

    for (const m of modelsToTest) {
        try {
            console.log(`\n--- Testing '${m}' ---`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hello check");
            const response = await result.response;
            console.log(`✅ SUCCESS: '${m}'`);
        } catch (e) {
            console.log(`❌ FAILED: '${m}'`);
            console.log(`   Error: ${e.message.split('\n')[0]}`);
        }
    }
}

listModels();
