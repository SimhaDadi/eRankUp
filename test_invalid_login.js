
const axios = require('axios');

async function testInvalidPayload() {
    try {
        console.log('Sending invalid payload...');
        const response = await axios.post('http://localhost:3001/auth/login', {
            // Missing email and password
            foo: 'bar'
        });
        console.log('Login successful (unexpected):', response.data);
    } catch (error) {
        console.log('Login failed as expected with status:', error.response ? error.response.status : error.message);
        if (error.response && error.response.data) {
            console.log('Error data:', error.response.data);
        }
    }
}

testInvalidPayload();
