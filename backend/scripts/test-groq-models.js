const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testScout() {
    const apiKey = process.env.GROQ_API_KEY;
    const groq = new Groq({ apiKey });

    // 1x1 pixel white transparent base64
    const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const model = "meta-llama/llama-4-scout-17b-16e-instruct";

    console.log(`Testing ${model}...`);
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'What color is this image?' },
                        { type: 'image_url', image_url: { url: `data:image/png;base64,${pixel}` } }
                    ]
                }
            ],
            model: model,
        });
        console.log(`✅ SUCCESS: ${completion.choices[0].message.content}`);
    } catch (e) {
        console.log(`❌ FAILED: ${e.message}`);
    }
}

testScout();
