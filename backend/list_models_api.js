
require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key");
        return;
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);

        const fs = require('fs');
        const stream = fs.createWriteStream('models_list.txt');

        console.log("Writing to models_list.txt...");
        const models = response.data.models || [];
        models.forEach(m => {
            stream.write(`Name: ${m.name}\n`);
            stream.write(`Supported: ${m.supportedGenerationMethods.join(', ')}\n`);
            stream.write('___\n');
        });
        stream.end();
        console.log("Done.");

    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
    }
}

listModels();
