const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in environment");
        return;
    }

    try {
        console.log("Fetching available models...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            const output = data.models.map(m => `- ${m.name}`).join('\n');
            console.log(output);
            fs.writeFileSync('models.txt', output);
            console.log("Models written to models.txt");
        } else {
            console.error("Failed to list models:", data);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
