
const BASE_URL = 'http://localhost:3001';

async function debugQuestions() {
    console.log('🔍 Debugging Questions API...');

    try {
        // 1. Login as Admin
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@erankup.com', password: 'adminpassword' })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const list = await loginRes.json();
        const token = list.access_token;
        console.log('✅ Admin Token received');

        // 2. Fetch Questions
        console.log('Fetching /exams/questions/global ...');
        const qRes = await fetch(`${BASE_URL}/exams/questions/global`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!qRes.ok) {
            console.error(`❌ API Failed: ${qRes.status} ${qRes.statusText}`);
            const text = await qRes.text();
            console.error('Response:', text);
            return;
        }

        const data = await qRes.json();

        console.log('✅ API Success. Response Type:', Array.isArray(data) ? 'Array' : typeof data);
        if (Array.isArray(data) && data.length > 0) {
            console.log('First Record Sample:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('Data:', data);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugQuestions();
