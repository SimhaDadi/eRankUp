const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.2-11b-vision-preview';

    console.log(`Testing Groq API with model: ${model}`);
    console.log(`API Key set: ${!!apiKey}`);

    if (!apiKey) {
        console.error("GROQ_API_KEY missing!");
        process.exit(1);
    }

    try {
        const groq = new Groq({ apiKey });
        const start = Date.now();

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: 'Hello! Just ensuring you are working roughly nicely.'
                }
            ],
            model: model,
        });

        console.log("------------------------------------------");
        console.log("✅ Groq Success!");
        console.log(`Time: ${Date.now() - start}ms`);
        console.log("Response:", completion.choices[0]?.message?.content);
        console.log("------------------------------------------");

    } catch (e) {
        console.error("❌ Groq Failed:", e.message);
        if (e.message.includes("401")) console.error("Invalid API Key");
        if (e.message.includes("429")) console.error("Rate Limit Exceeded");
    }
}

testGroq();
