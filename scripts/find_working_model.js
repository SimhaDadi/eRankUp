
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`Testing model: ${modelName} ...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log(`[SUCCESS] ${modelName}: ${response.text()}`);
        return true;
    } catch (error) {
        console.log(`[FAILED] ${modelName}: ${error.message.split('[')[0]}`); // Log only the error type/code
        if (error.message.includes("429")) console.log("   -> Quota Exceeded");
        if (error.message.includes("404")) console.log("   -> Not Found");
        return false;
    }
}

async function runCallback() {
    // List of reliable models to try (Standard + Experimental)
    const candidates = [
        "gemini-2.0-flash-lite-001",
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-exp-1206",
        "gemini-2.0-flash-exp",
        "learnlm-1.5-pro-experimental"
    ];

    for (const model of candidates) {
        const success = await testModel(model);
        if (success) {
            console.log(`\n>>> FOUND WORKING MODEL: ${model} <<<`);
            process.exit(0);
        }
    }
    console.log("\nNo working models found.");
    process.exit(1);
}

runCallback();
