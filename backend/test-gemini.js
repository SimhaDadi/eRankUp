require('dotenv').config();
const https = require('https');

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Checking API Key...");

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env");
        return;
    }

    console.log(`✅ API Key found (Length: ${apiKey.length}, Starts with: ${apiKey.substring(0, 4)}...)`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const data = JSON.stringify({
        contents: [{
            parts: [{ text: "Hello, are you working?" }]
        }]
    });

    console.log("\nSending request to Gemini API...");

    // Using native fetch if available (Node 18+), else https
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data
        });

        if (!response.ok) {
            console.error(`❌ Request Failed: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error("Error Body:", errorBody);
            return;
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            console.log("\n✅ Success! AI Response:");
            console.log("--------------------------------------------------");
            console.log(text);
            console.log("--------------------------------------------------");
        } else {
            console.log("⚠️ Response received but no text content found.");
            console.log(JSON.stringify(result, null, 2));
        }

    } catch (err) {
        console.error("❌ Network/Client Error:", err);
    }
}

testGemini();
