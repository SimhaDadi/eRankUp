
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testCapabilities() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    const imagePart = {
        inlineData: {
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            mimeType: "image/png"
        }
    };

    const models = [
        "models/gemma-3-4b-it",
        "models/gemini-2.0-flash-lite-001"
    ];

    console.log("Testing capabilities...\n");

    for (const m of models) {
        console.log(`--- Testing ${m} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: m });

            // Test 1: Text Only
            process.stdout.write("Text Only: ");
            try {
                await model.generateContent("Hello");
                console.log("✅ OK");
            } catch (e) {
                console.log(`❌ Fail: ${e.message.split('\n')[0]}`);
            }

            // Test 2: Text + Image
            process.stdout.write("Text + Image: ");
            try {
                await model.generateContent(["Describe this", imagePart]);
                console.log("✅ OK");
            } catch (e) {
                console.log(`❌ Fail: ${e.message.split('\n')[0]}`);
            }
            console.log("");
        } catch (e) {
            console.log(`Setup Error: ${e.message}\n`);
        }
    }
}

testCapabilities();
