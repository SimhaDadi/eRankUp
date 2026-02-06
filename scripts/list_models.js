
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "NOT FOUND");

    if (!apiKey) {
        console.error("No API Key found. Check backend/.env");
        return;
    }

    // Use REST API to list models
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log(`Fetching models from ${url}...`);
        const response = await fetch(url);
        const data = await response.json();

        const fs = require('fs');
        fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        console.log("Saved models to models.json");

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (methods: ${m.supportedGenerationMethods?.join(', ')})`);
            });
        } else {
            console.log("No models found or error structure:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

listModels();
