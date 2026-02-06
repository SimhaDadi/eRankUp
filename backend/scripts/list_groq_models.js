const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listModels() {
    const apiKey = process.env.GROQ_API_KEY;
    const groq = new Groq({ apiKey });

    try {
        const models = await groq.models.list();
        console.log("Available Groq Models:");
        models.data.forEach(m => console.log(m.id));
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
