const axios = require('axios');

async function testExam() {
    const examId = '9632eb91-7681-4246-8e50-4cc693c4e38c'; // Example from previous sessions if known, else I'll find one
    try {
        const response = await axios.get(`http://localhost:3001/exams/${examId}`);
        console.log('Status:', response.status);
        console.log('Title:', response.data.title);
        console.log('Chapters Count:', response.data.chapters ? response.data.chapters.length : 'MISSING');
        if (response.data.chapters) {
            console.log('First Chapter Models:', response.data.chapters[0]?.models?.length || 0);
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) console.log('Response Data:', err.response.data);
    }
}

testExam();
