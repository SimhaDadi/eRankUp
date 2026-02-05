
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function testAllModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key");
        return;
    }

    // Read models from file
    const content = fs.readFileSync('models_list.txt', 'utf8');
    const modelNames = content.split('\n')
        .filter(line => line.startsWith('Name: '))
        .map(line => line.replace('Name: ', '').trim());

    const genAI = new GoogleGenerativeAI(apiKey);

    console.log(`Testing ${modelNames.length} models...`);

    for (const m of modelNames) {
        // Skip embedding/image/predict models, focus on generateContent supported ones
        // But for simplicity just try basic text generation
        if (m.includes('embedding') || m.includes('imagen') || m.includes('veo') || m.includes('face')) continue;

        process.stdout.write(`Testing ${m}... `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`✅ SUCCESS`);
        } catch (e) {
            let error = e.message.split('\n')[0];
            if (error.includes('404')) console.log('❌ 404 Not Found');
            else if (error.includes('429')) console.log('❌ 429 Quota Exceeded');
            else console.log(`❌ Error: ${error}`);
        }
    }
}

testAllModels();
