
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Match the key from .env
const API_KEY = 'AIzaSyAOvAuiIZd_HxLCF-a6zrFP6-TR5zrWE5Q';

async function testGemini() {
    console.log('🤖 Testing Gemini API Integration...');

    if (!API_KEY || API_KEY.includes('placeholder')) {
        console.error('❌ Invalid API Key detected: ' + API_KEY);
        // We know the key in .env looks possibly real, let's try it.
        // Wait, "AIzaSyAOvAuiIZd_HxLCF-a6zrFP6-TR5zrWE5Q" is actually a VALID-LOOKING format for Google AI keys.
        // But is it active?
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });  // Check model name

        const prompt = 'Explain Newton\'s Second Law in one sentence.';
        console.log(`Sending prompt: "${prompt}"`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('\n✅ Success! AI Response:');
        console.log(text);
    } catch (error) {
        console.error('\n❌ API Call Failed:');
        console.error(error.message);

        if (error.status === 404) {
            console.log('Hint: Check model name. "gemini-flash-latest" might be incorrect/deprecated. Try "gemini-1.5-flash".');
        }
    }
}

testGemini();
