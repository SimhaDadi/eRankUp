const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModel(modelName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found");
        return;
    }

    console.log(`Testing model: ${modelName}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Hello, strictly reply with 'OK'.");
        console.log(`[SUCCESS] ${modelName}:`, result.response.text());
    } catch (error) {
        console.error(`[FAILED] ${modelName}:`, error.message);
    }
}

// Test potential candidates
async function runTests() {
    console.log("--- Testing Candidates ---");
    // Standard Lite (hit rate limit, but maybe okay?)
    // await testModel("gemini-2.0-flash-lite-001"); 

    // Older / Different Lite
    await testModel("gemini-2.0-flash-lite-preview-09-2025");

    // The 'latest' alias which might point to a stable version
    await testModel("gemini-flash-lite-latest");
}

runTests();
