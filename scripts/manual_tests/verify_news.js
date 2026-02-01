const axios = require('axios');

const API_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@erankup.com';
const ADMIN_PASSWORD = 'adminpassword';

async function verifyNews() {
    console.log('--- Current Affairs (News) Verification ---');
    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.access_token;
        console.log('✅ Login successful.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Fetch News (Default params)
        console.log('\n2. Fetching news (Default)...');
        try {
            const newsRes = await axios.get(`${API_URL}/news`, config);
            console.log('✅ News fetched successfully.');
            console.log(`   Count: ${newsRes.data.items.length}`);
            console.log(`   Total: ${newsRes.data.total}`);
        } catch (err) {
            console.error('❌ Fetch News Failed:', err.response?.data || err.message);
        }

        // 3. Fetch News (Category: Science & Tech)
        console.log('\n3. Fetching news (Category: Science & Tech)...');
        try {
            const scienceRes = await axios.get(`${API_URL}/news?category=Science %26 Tech`, config);
            console.log('✅ Science & Tech news fetched.');
            const allMatch = scienceRes.data.items.every(n => n.category === 'Science & Tech');
            if (allMatch) {
                console.log('✅ All items correctly match the category.');
            } else {
                console.log('❌ Category filtering mismatch found!');
            }
        } catch (err) {
            console.error('❌ Category Fetch Failed:', err.response?.data || err.message);
        }

        // 4. Create News (Admin only)
        console.log('\n4. Creating a test news item...');
        const newsData = {
            title: `Breaking News ${new Date().getTime()}`,
            summary: "A short summary for testing.",
            content: "<p>Full content of the news item.</p>",
            category: "National",
            tags: ["test", "verification"]
        };
        try {
            const createRes = await axios.post(`${API_URL}/news`, newsData, config);
            console.log('✅ News created successfully. ID:', createRes.data.id);
        } catch (err) {
            console.error('❌ News Creation Failed:', err.response?.data || err.message);
        }

        console.log('\n--- VERIFICATION FINISHED ---');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data));
        } else {
            console.error('   Message:', error.message);
        }
    }
}

verifyNews();
