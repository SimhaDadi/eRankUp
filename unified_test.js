
const http = require('http');

function post(path, data) {
    return new Promise((resolve, reject) => {
        const strData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': strData.length
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(strData);
        req.end();
    });
}

function get(path, token) {
    return new Promise((resolve, reject) => {
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
            res.on('data', (d) => body += d);
            res.on('end', () => {
                console.log(`GET ${path} -> Status: ${res.statusCode}`);
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTest() {
    try {
        console.log('Logging in...');
        const loginRes = await post('/auth/login', {
            email: 'admin@erankup.com',
            password: 'adminpassword'
        });
        const token = loginRes.access_token;
        if (!token) {
            console.error('Login failed:', loginRes);
            return;
        }

        const examId = 'f94d3cde-bcac-4628-b637-f0940ce00104';
        const modelId = '156700c1-1edc-4f75-a33c-f1a67d952766';

        const res1 = await get(`/exams/models/${modelId}`, token);
        console.log('Model ID Result:', res1.title || 'NULL');

        const res2 = await get(`/exams/models/${examId}`, token);
        console.log('Exam ID Result:', res2.title || 'NULL');
        if (res2.questions) console.log('Exam ID Q Count:', res2.questions.length);

    } catch (err) {
        console.error(err);
    }
}

runTest();
