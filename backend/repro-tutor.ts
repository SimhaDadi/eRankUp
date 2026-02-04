import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testApi() {
    console.log('--- REPRODUCING TUTOR ERROR ---');

    // 1. Login to get JWT
    // (Assuming you have a test user or can bypass auth for this script)
    // Since I don't have user credentials easily, I'll try to get them from the DB

    // Instead of full login, I'll just check if the server is up and reachable
    const baseUrl = 'http://localhost:3001';
    console.log('Target URL:', baseUrl);

    try {
        const health = await axios.get(`${baseUrl}/analytics/overview`);
        console.log('Health Check:', health.status);
    } catch (err) {
        console.error('Connection Failed:', err.message);
    }

    console.log('Wait... I can check the logs better if I search for "ERROR" in the whole backend dir.');
}

testApi();
