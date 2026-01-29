
const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTMwZGI2OC0yYmM4LTQxNzUtYmM5Yy05NDQ4M2EwOTkzOWYiLCJlbWFpbCI6ImFkbWluQGVyYW5rdXAuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY5Njk0MDIwLCJleHAiOjE3Njk2OTc2MjB9';

function testEndpoint(path) {
    console.log(`\nTesting: ${path}`);
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        console.log(`Status: ${res.statusCode}`);
        res.on('data', (d) => body += d);
        res.on('end', () => {
            try {
                const json = JSON.parse(body);
                console.log('Result:', json.title || 'NO TITLE', `(ID: ${json.id})`);
                if (json.questions) console.log('Questions:', json.questions.length);
                if (json.exams) console.log('Linked Exams:', json.exams.length);
            } catch (e) {
                console.log('Body:', body);
            }
        });
    });

    req.on('error', (e) => {
        console.error(e);
    });

    req.end();
}

const examId = 'f94d3cde-bcac-4628-b637-f0940ce00104';
const modelId = '156700c1-1edc-4f75-a33c-f1a67d952766';

testEndpoint(`/exams/models/${modelId}`);
testEndpoint(`/exams/models/${examId}`);
