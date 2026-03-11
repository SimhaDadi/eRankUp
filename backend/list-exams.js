const axios = require('axios');

async function listExams() {
    try {
        const response = await axios.get('http://localhost:3001/exams');
        console.log('Total Exams:', response.data.length);
        response.data.slice(0, 5).forEach(e => {
            console.log(`ID: ${e.id} | Title: ${e.title}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listExams();
