
const axios = require('axios');

async function testLogging() {
    try {
        console.log('Triggering 404...');
        await axios.get('http://localhost:3001/api/non-existent-endpoint');
    } catch (error) {
        console.log('404 Triggered:', error.response ? error.response.status : error.message);
    }
}

testLogging();
