const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'admin@erankup.com',
            password: 'adminpassword' // Assuming this is the seed password
        });
        console.log('Login Success:', response.status);
        console.log(response.data);
        const token = response.data.access_token;

        console.log('Testing System Health with Token...');
        try {
            const healthRes = await axios.get('http://localhost:3001/admin/system/health', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Health Check Success:', healthRes.status, healthRes.data);
        } catch (healthErr) {
            console.error('Health Check Failed:', healthErr.response ? healthErr.response.status : healthErr.message);
            if (healthErr.response) console.error(healthErr.response.data);
        }
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testLogin();
