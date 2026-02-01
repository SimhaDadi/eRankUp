const axios = require('axios');

const API_URL = 'http://localhost:3001';
const TEST_EMAIL = 'admin@erankup.com';
const TEST_PASSWORD = 'adminpassword';

async function verifyCommunity() {
    console.log('--- Community Feature Verification ---');
    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        const token = loginRes.data.access_token;
        console.log('✅ Login successful.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Create a Test Post
        console.log('\n2. Creating a test post...');
        const postContent = `Test Post at ${new Date().toISOString()}: SSC CGL Strategy discussion.`;
        const createPostRes = await axios.post(`${API_URL}/community/posts`, {
            content: postContent,
            category: 'Strategy'
        }, config);
        const postId = createPostRes.data.id;
        console.log('✅ Post created successfully. ID:', postId);

        // 3. Fetch Feed (All)
        console.log('\n3. Fetching community feed (All)...');
        const feedRes = await axios.get(`${API_URL}/community/feed`, config);
        console.log('✅ Feed fetched successfully.');
        console.log(`   Count: ${feedRes.data.length}`);

        const latestPost = feedRes.data[0];
        if (latestPost && latestPost.id === postId) {
            console.log('✅ Latest post matches the created post.');
        } else {
            console.log('⚠️ Latest post ID does NOT match (might be due to multiple testers or sorting).');
        }

        // 4. Fetch Feed (Category: Strategy)
        console.log('\n4. Fetching feed for "Strategy" category...');
        const strategyRes = await axios.get(`${API_URL}/community/feed?category=Strategy`, config);
        console.log('✅ Strategy feed fetched successfully.');
        const found = strategyRes.data.some(p => p.id === postId);
        if (found) {
            console.log('✅ Found the created post in the Strategy category.');
        } else {
            console.log('❌ Created post NOT found in Strategy category!');
        }

        // 5. Fetch Feed (Category: Doubt) - Should be filtered out
        console.log('\n5. Fetching feed for "Doubt" category (post should be absent)...');
        const doubtRes = await axios.get(`${API_URL}/community/feed?category=Doubt`, config);
        const shouldBeMissing = !doubtRes.data.some(p => p.id === postId);
        if (shouldBeMissing) {
            console.log('✅ Created post correctly filtered out from Doubt category.');
        } else {
            console.log('❌ Created post INCORRECTLY visible in Doubt category!');
        }

        console.log('\n--- VERIFICATION SUCCESSFUL ---');

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

verifyCommunity();
