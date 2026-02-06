const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listModels() {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('Using API Key:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING');

    if (!apiKey) {
        console.error("No API key found.");
        return;
    }

    const groq = new Groq({ apiKey });

    try {
        const list = await groq.models.list();
        console.log("------------------------------------------------");
        console.log("AVAILABLE GROQ MODELS:");
        console.log("------------------------------------------------");
        list.data.forEach((model) => {
            console.log(`- ${model.id} (Owner: ${model.owned_by})`);
        });
        console.log("------------------------------------------------");
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
