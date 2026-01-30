const axios = require('axios');

const API_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@erankup.com';
const ADMIN_PASSWORD = 'adminpassword';
const STUDENT_ID = '87a62bd5-3a6d-4753-b1db-5c44171f30be'; // sriharigorle.123@gmail.com

async function verifyAnalytics() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.access_token;
        console.log('Login successful. Token obtained.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Get Student Details
        console.log(`\nFetching details for student: ${STUDENT_ID}`);
        try {
            const detailsRes = await axios.get(`${API_URL}/analytics/students/${STUDENT_ID}`, config);
            console.log('✅ Details Endpoint: OK');
            console.log('   Profile:', detailsRes.data.profile?.fullName);
            console.log('   Stats:', JSON.stringify(detailsRes.data.stats));
        } catch (err) {
            console.error('❌ Details Endpoint Failed:', err.response?.data || err.message);
        }

        // 3. Get Student Attempts
        try {
            const attemptsRes = await axios.get(`${API_URL}/analytics/students/${STUDENT_ID}/attempts`, config);
            console.log('✅ Attempts Endpoint: OK');
            console.log(`   Count: ${attemptsRes.data.length}`);
            if (attemptsRes.data.length > 0) {
                console.log('   Sample:', JSON.stringify(attemptsRes.data[0]).substring(0, 100) + '...');
            }
        } catch (err) {
            console.error('❌ Attempts Endpoint Failed:', err.response?.data || err.message);
        }

        // 4. Get Student Activity
        try {
            const activityRes = await axios.get(`${API_URL}/analytics/students/${STUDENT_ID}/activity`, config);
            console.log('✅ Activity Endpoint: OK');
            console.log(`   Data Points: ${activityRes.data.length}`);
        } catch (err) {
            console.error('❌ Activity Endpoint Failed:', err.response?.data || err.message);
        }

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

verifyAnalytics();
