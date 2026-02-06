
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Checking models for API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "NOT FOUND");

    if (!apiKey) {
        console.error("No API Key found. Check backend/.env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // Only available in v1beta? The SDK uses v1beta by default usually.
        // There isn't a direct listModels on genAI instance in some SDK versions, but let's try via the model manager if accessible or just a raw fetch if needed.
        // Actually, older SDKs didn't expose listModels easily. 
        // Let's try to infer from a simple generation test on candidate models.

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "models/gemini-1.5-flash"
        ];

        console.log("Testing candidate models...");

        for (const modelName of candidates) {
            try {
                process.stdout.write(`Testing ${modelName}: `);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log("SUCCESS ✅");
            } catch (e: any) {
                console.log(`FAILED ❌ (${e.message.split('[')[0].substring(0, 50)}...)`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
