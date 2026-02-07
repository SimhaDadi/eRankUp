
const axios = require('axios');

async function testSignupAndLogin() {
    const email = `testuser_${Date.now()}@example.com`;
    try {
        console.log(`Registering ${email}...`);
        await axios.post('http://localhost:3001/auth/signup', {
            email: email,
            password: 'password123',
            fullName: 'Test User'
        });
        console.log('Signup successful.');

        console.log('Logging in...');
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: email,
            password: 'password123'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testSignupAndLogin();
