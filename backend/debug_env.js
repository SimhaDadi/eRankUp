const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
console.log('Checking .env at:', envPath);

if (fs.existsSync(envPath)) {
    console.log('.env file exists.');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    // console.log('Parsed content:', envConfig); 

    const key = envConfig.GROQ_API_KEY;
    if (key) {
        console.log('GROQ_API_KEY found in .env');
        console.log('Length:', key.length);
        console.log('First 5 chars:', key.substring(0, 5));
    } else {
        console.error('GROQ_API_KEY NOT found in .env parse result.');
    }
} else {
    console.error('.env file does NOT exist at expected path.');
}

console.log('-------------------');
console.log('Process.env check (without dotenv config)');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');

dotenv.config();
console.log('Process.env check (AFTER dotenv config)');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
if (process.env.GROQ_API_KEY) {
    console.log('Value:', process.env.GROQ_API_KEY);
}
