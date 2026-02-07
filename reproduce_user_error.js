
const axios = require('axios');

async function testLoginUserWithoutPassword() {
    try {
        console.log('Attempting login for user@example.com...');
        // password can be anything since it's going to fail anyway or hit "no password" check
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'user@example.com',
            password: 'somepassword'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        console.log('Login failed with status:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.log('Error data:', error.response.data);
        }
    }
}

testLoginUserWithoutPassword();
