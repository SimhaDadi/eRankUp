const axios = require('axios');

async function testExportFilename() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3001/auth/login', {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        const token = loginRes.data.access_token;
        console.log('Logged in.');

        // 1. Test Default Export
        console.log('\n--- Test 1: Default Export (No filters) ---');
        try {
            const res1 = await axios.get('http://localhost:3001/questions/export', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Content-Disposition:', res1.headers['content-disposition']);
        } catch (e) {
            console.error('Test 1 Failed:', e.message);
        }

        // 2. Test Chapter Export (Hardcoded ID)
        // If this ID exists, we get a name. If not, we get default.
        const chapterId = '1094d5af-50e6-4a5d-9084-4c673fb14e4b';
        console.log(`\n--- Test 2: Chapter Export (ID: ${chapterId}) ---`);
        try {
            const resChapter = await axios.get(`http://localhost:3001/questions/export?chapterId=${chapterId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Content-Disposition:', resChapter.headers['content-disposition']);
        } catch (e) {
            console.error('Test 2 Failed:', e.message);
        }

    } catch (error) {
        console.error('Login Failed:', error.message);
    }
}

testExportFilename();
