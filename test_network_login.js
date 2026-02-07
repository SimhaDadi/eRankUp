
const axios = require('axios');

async function testNetworkLogin() {
    try {
        console.log('Attempting login via network IP...');
        const response = await axios.post('http://172.31.240.136:3001/auth/login', {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
        if (error.response) console.log('Status:', error.response.status);
    }
}

testNetworkLogin();
