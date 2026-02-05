import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // Use the native SDK listModels if available, or just try to instantiate common ones
        console.log("Attempting to list models...");
        // The SDK doesn't have a direct listModels, we usually use the REST API or Vertex
        // But we can check which models respond to generateContent
        const testModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-flash-latest"];

        for (const modelName of testModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                console.log(`Model ${modelName} instantiated successfully`);
            } catch (e) {
                console.log(`Model ${modelName} failed to instantiate: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
