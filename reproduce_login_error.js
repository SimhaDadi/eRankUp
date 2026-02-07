
const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 500) {
            console.log('Successfully reproduced 500 error');
        }
    }
}

testLogin();
